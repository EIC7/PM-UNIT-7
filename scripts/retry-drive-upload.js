// ============================================================
//  Jaring pengaman: retry upload foto yang nyangkut base64 mentah di
//  Supabase (gagal ke Google Drive sebelumnya) -- jalan berkala lewat
//  GitHub Actions (.github/workflows/retry-drive-upload.yml), TIDAK
//  butuh siapa pun buka aplikasi.
//
//  Kenapa perlu: dbSaveSilent() (autosave) di shared.js SENGAJA tidak
//  menolak simpan kalau upload ke Drive gagal (beda dari dbSave() yang
//  sekarang menolak) -- base64-nya ketinggalan mentah di Supabase
//  selamanya kalau user tidak pernah balik nyimpen ulang record itu draft
//  itu secara manual. Ini bikin payload_size record itu jadi besar (boros
//  storage & egress tiap kali record itu dibaca).
//
//  DETEKSI: scan LANGSUNG isi `data` tiap record cari objek foto yang
//  dataUrl-nya masih base64 ('data:...') TAPI belum punya driveUrl --
//  SENGAJA TIDAK pakai kolom payload_size sebagai filter (pernah
//  ditemukan basi/tidak ter-update di beberapa record, lihat CLAUDE.md).
//
//  SCOPE DIBATASI: cuma record status='draft' yang di-update dalam
//  RECENT_DAYS terakhir (bukan seluruh histori) -- supaya job ini sendiri
//  tidak ikut boros egress (baca `data` penuh tiap record itu sendiri
//  makan bandwidth) tiap kali jalan. Record SUBMITTED tidak perlu
//  di-scan di sini -- dbSave() sekarang menolak simpan kalau upload
//  gagal, jadi record submitted baru seharusnya tidak pernah kena kasus
//  ini lagi; retry utamanya (raRetryPendingFirebaseSyncs) juga sudah
//  jalan sendiri dari sisi client untuk urusan sync ke Firebase.
//
//  Sama persis logikanya (collectPending/stripBase64/upload) dengan
//  _pmEnsureAllPhotosOnDrive()/_pmStripBase64ForSave() di shared.js --
//  cuma dijalankan dari Node, bukan browser.
// ============================================================

const SUPA_URL = 'https://ruvvximnnacpvvoogbzs.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE1NDAsImV4cCI6MjA5NDYxNzU0MH0.GRu5n0Jl2fP0V8L_QLN2Tkmd0Aw0JbMRu25I7t-R7l8';

const GDRIVE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxyxAOQaIFkT9EZtTHfkjQeG3TlkLnEu2AKVyhUnguK7Td_zls1qL7IPB_hLsXTaLNBHA/exec';
const GDRIVE_SECRET_TOKEN = 'pmeicunit7-mahfud';

const RECENT_DAYS = 14;
const MAX_ATTEMPTS = 3;
const RECORD_LIMIT = 50;

function genUniqueDriveFileName(modul) {
  const safeModul = (modul || 'foto').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
  return safeModul + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.jpg';
}

function gdriveFileIdToViewUrl(fileId) {
  return 'https://lh3.googleusercontent.com/d/' + fileId;
}

function collectPending(dataObj) {
  const found = [];
  (function walk(o) {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    if (typeof o.dataUrl === 'string' && o.dataUrl.indexOf('data:') === 0 && !o.driveUrl) { found.push(o); return; }
    Object.keys(o).forEach((k) => walk(o[k]));
  })(dataObj);
  return found;
}

function stripBase64(obj) {
  if (Array.isArray(obj)) { obj.forEach(stripBase64); return; }
  if (!obj || typeof obj !== 'object') return;
  if (typeof obj.dataUrl === 'string' && obj.dataUrl.indexOf('data:') === 0 && obj.driveUrl) {
    obj.dataUrl = '';
  }
  Object.keys(obj).forEach((k) => stripBase64(obj[k]));
}

async function uploadOneToDrive(entry, modul) {
  const driveFileName = genUniqueDriveFileName(modul);
  const res = await fetch(GDRIVE_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      token: GDRIVE_SECRET_TOKEN,
      imageBase64: entry.dataUrl,
      fileName: driveFileName,
      originalFileName: entry.name || '',
      modul: modul || 'unknown',
      keterangan: entry.caption || '',
    }),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Upload gagal tanpa pesan error');
  entry.driveUrl = gdriveFileIdToViewUrl(result.fileId);
  entry.driveFileId = result.fileId;
}

function byteLength(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

async function fetchCandidateDrafts() {
  const since = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString();
  const url = SUPA_URL + '/rest/v1/pm_records?select=id,modul,status,payload_size,data'
    + '&status=eq.draft&updated_at=gte.' + encodeURIComponent(since)
    + '&order=updated_at.desc&limit=' + RECORD_LIMIT;
  const res = await fetch(url, { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } });
  if (!res.ok) throw new Error('Gagal ambil pm_records: ' + res.status + ' ' + (await res.text()));
  return res.json();
}

async function patchRecord(id, data) {
  const payload_size = byteLength(data);
  const res = await fetch(SUPA_URL + '/rest/v1/pm_records?id=eq.' + id, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ data, payload_size }),
  });
  if (!res.ok) throw new Error('Gagal PATCH record ' + id + ': ' + res.status + ' ' + (await res.text()));
}

async function processRecord(rec) {
  let pending = collectPending(rec.data);
  if (!pending.length) return; // bersih, tidak perlu apa-apa -- kasus normal, tidak perlu di-log tiap record

  console.log(`[${rec.modul}] ${rec.id.slice(0, 8)} -- ${pending.length} foto base64 belum ke Drive, retry...`);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && pending.length; attempt++) {
    let okCount = 0;
    for (const entry of pending) {
      try {
        await uploadOneToDrive(entry, rec.modul);
        okCount++;
      } catch (e) {
        console.warn(`  gagal 1 foto (${entry.name || 'tanpa nama'}) percobaan ${attempt}: ${e.message}`);
      }
    }
    console.log(`  percobaan ${attempt}/${MAX_ATTEMPTS}: ${okCount}/${pending.length} berhasil.`);
    pending = collectPending(rec.data);
  }

  if (pending.length) {
    console.warn(`  MASIH ada ${pending.length} foto gagal setelah ${MAX_ATTEMPTS}x -- record TIDAK di-PATCH, dicoba lagi siklus berikutnya.`);
    return;
  }

  const before = rec.payload_size;
  stripBase64(rec.data);
  await patchRecord(rec.id, rec.data);
  const after = byteLength(rec.data);
  console.log(`  ✓ Selesai. Tercatat sebelumnya ${(before / 1024).toFixed(0)}KB -> sekarang ${(after / 1024).toFixed(1)}KB (payload_size ikut diperbarui).`);
}

async function main() {
  const drafts = await fetchCandidateDrafts();
  console.log(`Cek ${drafts.length} draft yang diubah dalam ${RECENT_DAYS} hari terakhir...`);
  let touched = 0;
  for (const rec of drafts) {
    const before = collectPending(rec.data).length;
    await processRecord(rec);
    if (before) touched++;
  }
  console.log(touched ? `Selesai. ${touched} record ditangani.` : 'Selesai. Tidak ada yang perlu ditangani.');
}

main().catch((err) => {
  console.error('Gagal:', err);
  process.exit(1);
});
