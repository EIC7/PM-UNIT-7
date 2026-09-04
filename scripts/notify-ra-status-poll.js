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
//
//  SEKALIGUS jadi alert kesehatan Supabase (checkAndAlertSupabaseHealth) --
//  ngecek /auth/v1/health tiap jalan, kirim Telegram LANGSUNG (bypass RPC,
//  karena kalau Supabase down RPC-nya juga ikut tidak bisa dipanggil) kalau
//  status berubah jadi unhealthy/stopped. Butuh GitHub Secret
//  TELEGRAM_BOT_TOKEN di-set dulu (Settings -> Secrets and variables ->
//  Actions), TANPA itu bagian alert-nya cuma nge-log error, bukan crash.
// ============================================================

const fs = require('fs');

const SUPA_URL = 'https://xzjayhjierilqxwucnkn.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6amF5aGppZXJpbHF4d3VjbmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzM4NTMsImV4cCI6MjEwNDEwOTg1M30.KX0iL0IAf0uWDj0yb_YFyRDu3pINNzYo36ZSmFXn-nI';

const FIREBASE_PROJECT_ID = 'pomi-checksheet-e7';
const FIREBASE_API_KEY = 'AIzaSyB2c5ZFYRH8rKRcYlza175wTM36O8jwDGw';

const VALID_STATUSES = ['reviewed', 'approved', 'returned_to_technician', 'revision_resubmitted'];

// ── Alert LANGSUNG kalau Supabase sendiri down/unhealthy ──────────────────
// SENGAJA tidak lewat RPC notify_telegram_review_status (fungsi Postgres --
// kalau Supabase-nya yang down, fungsi itu ikut tidak bisa dipanggil, jadi
// tidak bisa dipakai buat "memberi tahu Supabase sedang down"). Token bot
// di sini WAJIB dari GitHub Secret (env var), JANGAN PERNAH ditulis
// langsung di file ini -- repo ini PUBLIC, pernah ada insiden token bocor
// ke commit publik gara-gara ditempel langsung (lihat CLAUDE.md).
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ALERT_CHAT_ID = '-1004351464598'; // grup "Submit Report EIC7" -- chat id, bukan rahasia
const HEALTH_STATE_FILE = '.health-state.json';

// ── Pengingat expired token PAT "AUTO REFRESH HISTORY" (cron-job.org) ──
// GitHub Actions `schedule:` TIDAK bisa diandalkan tepat waktu (terbukti
// telat 1.5-5+ jam terus-menerus, lihat CLAUDE.md) -- makanya workflow ini
// sekarang DIPICU LANGSUNG oleh cron-job.org (eksternal) tiap 5 menit lewat
// API workflow_dispatch, pakai GitHub fine-grained PAT scope Actions:R/W
// khusus repo ini. PAT itu PUNYA TANGGAL EXPIRED -- kalau lupa diperpanjang,
// trigger eksternal ini berhenti diam-diam (fallback `schedule:` bawaan
// tetap ada tapi kembali ke masalah telat berjam-jam di atas). Tanggal di
// bawah ini HARUS diupdate manual tiap kali token di-regenerate/diperbarui.
const PAT_EXPIRY_DATE = '2026-12-03'; // token "AUTO REFRESH HISTORY", dibuat 2026-09-04
const PAT_REMINDER_DAYS = [3, 2, 1]; // cuma alert kalau SISA hari PERSIS salah satu ini

function daysUntil(isoDateStr) {
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetMs = new Date(isoDateStr + 'T00:00:00Z').getTime();
  return Math.round((targetMs - todayUtcMs) / 86400000);
}

// Alert cuma SEKALI per hari yang cocok (dedup via state.patReminderSentDate
// -- pola sama dengan state.state buat health Supabase, sama-sama nyimpen
// di HEALTH_STATE_FILE lewat actions/cache, lihat readState/writeState).
async function checkAndAlertPatExpiry(state) {
  const days = daysUntil(PAT_EXPIRY_DATE);
  if (PAT_REMINDER_DAYS.indexOf(days) === -1) return;
  const today = new Date().toISOString().slice(0, 10);
  if (state.patReminderSentDate === today) {
    console.log('Reminder PAT sudah dikirim hari ini, skip.');
    return;
  }
  await sendTelegramDirect(
    '⏰ PENGINGAT\nToken GitHub "AUTO REFRESH HISTORY" (dipakai cron-job.org buat memicu workflow RA Status Notify Poll tiap 5 menit) akan EXPIRED dalam ' + days + ' hari (' + PAT_EXPIRY_DATE + ').\n\n' +
    'Segera perbarui: buat/regenerate Fine-grained Personal Access Token baru di GitHub (scope Actions: Read and write, dibatasi ke repo PM-UNIT-7 saja), lalu update header Authorization di job "AUTO REFRESH HISTORY" di cron-job.org. Kalau lewat tanpa diperbarui, notifikasi Telegram reviewed/approved akan kembali telat berjam-jam seperti sebelum fitur ini dipasang.'
  );
  state.patReminderSentDate = today;
  console.log('Reminder PAT expiry terkirim (' + days + ' hari lagi).');
}

async function sendTelegramDirect(text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN belum di-set sebagai GitHub Secret -- tidak bisa kirim alert kesehatan Supabase.');
    return;
  }
  try {
    await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_ALERT_CHAT_ID, text: text })
    });
  } catch (e) {
    console.error('Gagal kirim alert Telegram langsung:', e);
  }
}

async function checkSupabaseHealth() {
  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
  try {
    const res = await fetch(SUPA_URL + '/auth/v1/health', {
      headers: { apikey: SUPA_KEY },
      signal: ctrl ? ctrl.signal : undefined
    });
    if (timer) clearTimeout(timer);
    if (res.status === 200) return 'ok';
    const body = await res.text().catch(function () { return ''; });
    if (/paused/i.test(body) || res.status === 503) return 'down';
    return 'warn';
  } catch (e) {
    if (timer) clearTimeout(timer);
    return 'down';
  }
}

// State gabungan (health Supabase + reminder PAT expiry) disimpan SATU
// file yang sama (HEALTH_STATE_FILE, dipersist lintas run lewat
// actions/cache -- lihat ra-notify-poll.yml). Dulu cuma {state, updatedAt}
// buat health Supabase; sekarang objek bebas field, dibaca/ditulis SEKALI
// di main() supaya kedua fitur tidak saling menimpa field satu sama lain.
function readState() {
  try { return JSON.parse(fs.readFileSync(HEALTH_STATE_FILE, 'utf8')); } catch (e) { return {}; }
}

function writeState(state) {
  state.updatedAt = new Date().toISOString();
  try { fs.writeFileSync(HEALTH_STATE_FILE, JSON.stringify(state)); } catch (e) {}
}

// true kalau Supabase down -- caller HARUS berhenti, sisa proses (query
// pm_records dkk) pasti gagal juga kalau Supabase-nya sendiri tidak sehat.
async function checkAndAlertSupabaseHealth(state) {
  const health = await checkSupabaseHealth();
  const prev = state.state || 'ok';

  if (health !== 'ok') {
    if (prev === 'ok') {
      await sendTelegramDirect(
        '⚠️ PERINGATAN\nSupabase Unhealthy / Stopped\n\n' +
        'Database pm_records (Supabase) tidak bisa diakses saat ini. ' +
        'Cek dashboard Supabase untuk detail.'
      );
      console.log('Alert Supabase down terkirim (episode baru).');
    } else {
      console.log('Supabase masih bermasalah, sudah pernah dialert -- skip supaya tidak spam.');
    }
    state.state = 'down';
    return true;
  }

  if (prev === 'down') {
    await sendTelegramDirect('✅ Supabase sudah kembali normal.');
    console.log('Alert pemulihan Supabase terkirim.');
  }
  state.state = 'ok';
  return false;
}

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
    const rawStatus = f.status && f.status.stringValue;
    if (!checksheetId || !rawStatus) continue;
    // Sama seperti historyDeriveStatus() di history.html.
    // 2026-08-30: Review Approval Dashboard nambah status ASLI 'revised' --
    // resubmit sesudah dikembalikan sekarang status-nya langsung 'revised'
    // dan returnedNote DIKOSONGKAN (dipindah ke array returnedHistory[]),
    // BUKAN lagi 'submitted'+returnedNote nempel. Cek 'revised' ini WAJIB
    // ada duluan -- tanpanya deteksi revisi berhenti total untuk resubmit
    // baru. Fallback returnedNote di bawah cuma buat dokumen lama.
    const hasReturnedNote = !!(f.returnedNote && f.returnedNote.mapValue);
    const status = rawStatus === 'revised' ? 'revision_resubmitted'
      : (rawStatus === 'submitted' && hasReturnedNote) ? 'revision_resubmitted' : rawStatus;
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
  const state = readState();

  // Cek reminder PAT expiry DULUAN -- independen dari Supabase, tetap
  // harus jalan walau Supabase sedang down (poller ini bisa saja jadi
  // satu-satunya kesempatan cek hari ini kalau schedule bawaan telat).
  await checkAndAlertPatExpiry(state);

  const supabaseDown = await checkAndAlertSupabaseHealth(state);
  writeState(state);
  if (supabaseDown) {
    console.log('Supabase tidak sehat -- lewati proses cek notifikasi RA (pasti gagal juga).');
    return;
  }

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
