// ============================================================
//  Jaring pengaman "Sampah": hapus PERMANEN record pm_records yang sudah
//  lebih dari RETENTION_DAYS hari berada di Sampah (kolom deleted_at
//  terisi) -- soft-delete dari history.html/jsa_history.html (lihat
//  histDelConfirmDo()/jsaDelConfirmDo()/dbSoftDeleteRecord() di shared.js)
//  TIDAK langsung hapus permanen, cuma menandai deleted_at supaya masih
//  bisa dipulihkan user lewat tombol "🗑️ Sampah" selama masa retensi.
//  Job ini yang benar-benar membuang record itu setelah masa retensi
//  lewat, jalan berkala tanpa perlu ada yang buka aplikasi (pola sama
//  dengan scripts/retry-drive-upload.js).
//
//  Ditambahkan 2026-09-15 setelah laporan user tidak sengaja menghapus
//  permanen laporan Maintenance Report yang sudah SUBMITTED, tanpa cara
//  memulihkannya (tidak ada akses Supabase Pro utk point-in-time recovery,
//  dan salinan di Review Approval Dashboard juga sudah kadung dihapus
//  terpisah). Sekarang ada jeda 7 hari sebelum data benar-benar hilang.
//
//  TIDAK menghapus foto di Google Drive milik record yang di-purge (sama
//  seperti hard-delete manual yang sudah ada dari awal, di luar scope
//  perubahan ini) -- kalau nanti perlu dibersihkan juga, itu pekerjaan
//  terpisah (perlu scan `data` record dulu sebelum baris-nya hilang).
//
//  Jadwal cron (GitHub Actions `schedule:`) TIDAK perlu presisi sama sekali
//  di sini -- retensi 7 hari punya banyak slack, telat beberapa jam/bahkan
//  sehari (lihat catatan "GitHub Actions schedule: TERBUKTI SELALU TELAT"
//  di CLAUDE.md) tidak masalah, BEDA dari notifikasi Telegram yang butuh
//  cron-job.org eksternal karena harus cepat.
// ============================================================

const SUPA_URL = 'https://xzjayhjierilqxwucnkn.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6amF5aGppZXJpbHF4d3VjbmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzM4NTMsImV4cCI6MjEwNDEwOTg1M30.KX0iL0IAf0uWDj0yb_YFyRDu3pINNzYo36ZSmFXn-nI';

// WAJIB SAMA dengan RA_TRASH_RETENTION_DAYS di shared.js -- kalau nanti mau
// ubah masa retensi, ubah KEDUA tempat ini sekaligus.
const RETENTION_DAYS = 7;
const BATCH_LIMIT = 200;

async function fetchExpiredTrash() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
  const url = SUPA_URL + '/rest/v1/pm_records?select=id,modul,deleted_at'
    + '&deleted_at=not.is.null&deleted_at=lte.' + encodeURIComponent(cutoff)
    + '&order=deleted_at.asc&limit=' + BATCH_LIMIT;
  const res = await fetch(url, { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } });
  if (!res.ok) {
    const body = await res.text();
    // Kolom deleted_at belum ada (migration belum dijalankan) -- PostgREST
    // balas error validasi kolom, bukan array kosong. Anggap "tidak ada
    // yang perlu di-purge" dan keluar bersih, JANGAN bikin job GitHub
    // Actions ini gagal terus-menerus cuma karena migration belum jalan.
    if (res.status === 400 && /column .*deleted_at.* does not exist/i.test(body)) {
      console.log('Kolom deleted_at belum ada di pm_records (migration belum dijalankan) -- lewati.');
      return [];
    }
    throw new Error('Gagal ambil pm_records (trash): ' + res.status + ' ' + body);
  }
  return res.json();
}

async function purgeOne(id) {
  const res = await fetch(SUPA_URL + '/rest/v1/pm_records?id=eq.' + id, {
    method: 'DELETE',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
  });
  if (!res.ok) throw new Error('Gagal hapus permanen ' + id + ': ' + res.status + ' ' + (await res.text()));
}

async function main() {
  const rows = await fetchExpiredTrash();
  console.log(`Ditemukan ${rows.length} record di Sampah yang sudah lewat ${RETENTION_DAYS} hari.`);
  let purged = 0;
  for (const r of rows) {
    try {
      await purgeOne(r.id);
      purged++;
      console.log(`  ✓ Dihapus permanen: ${r.modul} (${r.id.slice(0, 8)}, masuk Sampah ${r.deleted_at})`);
    } catch (e) {
      console.warn(`  gagal hapus ${r.id}: ${e.message}`);
    }
  }
  console.log(purged ? `Selesai. ${purged} record dihapus permanen.` : 'Selesai. Tidak ada yang perlu dihapus.');
}

main().catch((err) => {
  console.error('Gagal:', err);
  process.exit(1);
});
