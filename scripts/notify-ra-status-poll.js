// ============================================================
//  Poller notifikasi Telegram reviewed/approved -- lapis kedua yang jalan
//  otomatis TANPA butuh siapa pun buka history.html.
//
//  Kenapa perlu: status review/approval ada di Firestore (Review Approval
//  Dashboard, repo terpisah), bukan di Supabase. Selama ini satu-satunya
//  yang "mengintip" perubahan Firestore itu adalah history.html lewat
//  browser (lihat historyUpgradeStatusBadges() di history.html) -- kalau
//  tidak ada tab yang terbuka, notifnya menggantung sampai ada yang buka.
//  Script ini jalan terjadwal lewat GitHub Actions
//  (.github/workflows/ra-notify-poll.yml), independen dari browser mana
//  pun, sebagai jaring pengaman.
//
//  AMAN dijalankan bersamaan dengan history.html -- keduanya ujung-ujungnya
//  manggil RPC Supabase yang sama (notify_telegram_review_status), dan RPC
//  itu sudah pakai klaim atomik (UPDATE ... WHERE ra_notified_status IS
//  DISTINCT FROM p_status) sebelum kirim -- siapa pun yang lebih dulu
//  sampai akan "mengunci" duluan, yang satu lagi otomatis berhenti tanpa
//  ikut kirim. Tidak ada logika anti-dobel tambahan yang perlu ditulis di
//  sini, cukup andalkan RPC-nya.
// ============================================================

const SUPA_URL = 'https://ruvvximnnacpvvoogbzs.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE1NDAsImV4cCI6MjA5NDYxNzU0MH0.GRu5n0Jl2fP0V8L_QLN2Tkmd0Aw0JbMRu25I7t-R7l8';

const FIREBASE_PROJECT_ID = 'pomi-checksheet-e7';
const FIREBASE_API_KEY = 'AIzaSyB2c5ZFYRH8rKRcYlza175wTM36O8jwDGw';

const VALID_STATUSES = ['reviewed', 'approved', 'returned_to_technician'];

async function fetchRecentRecords() {
  const url = SUPA_URL + '/rest/v1/pm_records?select=id,modul,pic,work_order,firebase_checksheet_id,ra_notified_status'
    + '&firebase_checksheet_id=not.is.null&order=updated_at.desc&limit=300';
  const res = await fetch(url, { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } });
  if (!res.ok) throw new Error('Gagal ambil pm_records: ' + res.status + ' ' + (await res.text()));
  return res.json();
}

async function fetchRecentApprovals() {
  const url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID
    + '/databases/(default)/documents:runQuery?key=' + FIREBASE_API_KEY;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'approvals' }],
      orderBy: [{ field: { fieldPath: 'updatedAt' }, direction: 'DESCENDING' }],
      limit: 200
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Gagal query Firestore approvals: ' + res.status + ' ' + (await res.text()));
  const rows = await res.json();

  const byChecksheetId = {};
  for (const row of rows) {
    if (!row.document || !row.document.fields) continue;
    const f = row.document.fields;
    const checksheetId = f.checksheetId && f.checksheetId.stringValue;
    const status = f.status && f.status.stringValue;
    if (!checksheetId || !status) continue;
    byChecksheetId[checksheetId] = status;
  }
  return byChecksheetId;
}

async function notify(record, status) {
  const url = SUPA_URL + '/rest/v1/rpc/notify_telegram_review_status';
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_row_id: record.id,
      p_status: status,
      p_modul: record.modul || '',
      p_pic: record.pic || '',
      p_wo: record.work_order || ''
    })
  });
  if (!res.ok) {
    console.error('RPC gagal untuk record ' + record.id + ':', res.status, await res.text());
    return;
  }
  console.log('Diproses:', record.id, record.modul, '->', status);
}

async function main() {
  const [records, approvalsByChecksheetId] = await Promise.all([
    fetchRecentRecords(),
    fetchRecentApprovals()
  ]);

  let candidates = 0;
  for (const r of records) {
    const status = approvalsByChecksheetId[r.firebase_checksheet_id];
    if (!status) continue;
    if (VALID_STATUSES.indexOf(status) === -1) continue;
    if (status === r.ra_notified_status) continue; // sudah dinotif (atau sedang diklaim proses lain)
    candidates++;
    await notify(r, status);
  }
  console.log('Selesai. Kandidat diproses:', candidates, '/ total record dicek:', records.length);
}

main().catch(function (err) {
  console.error('Poll gagal:', err);
  process.exit(1);
});
