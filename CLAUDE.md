# Instruksi untuk Claude — baca file ini SEBELUM melakukan perubahan apa pun di repo ini

Repo ini berisi suite file HTML untuk OMS (Outage Management System) PLTU Paiton Unit 7:
form maintenance/kalibrasi/inspeksi, masing-masing satu file HTML mandiri (vanilla JS,
Supabase sebagai backend, jsPDF untuk export PDF).

## Wajib dilakukan sebelum push ke GitHub

1. **Tarik/cek versi terbaru dulu** — sebelum push, jalankan `git pull` (atau bandingkan
   commit remote lewat GitHub API/`git fetch` + `git log origin/main`) untuk file yang
   akan diubah. Jangan asumsikan working copy lokal sudah paling baru.
2. **Kasih kalimat perhatian ke user** sebelum push — beri tahu secara singkat bahwa
   Claude akan push, dan sebutkan hasil pengecekan versi remote (ada pembaruan lain atau
   tidak).
3. **Kalau ada revisi lain di remote** (file sudah diubah pihak lain/sesi lain sejak
   working copy lokal diambil):
   - Kalau perubahan remote **berbeda** dari revisi yang sedang dikerjakan Claude (area
     kode berbeda) → **gabungkan (merge)** keduanya, jangan menimpa salah satu.
   - Kalau perubahan remote **bentrok** dengan revisi Claude (mengubah bagian/kode yang
     sama dengan cara berbeda) → **tanyakan ke user** versi mana yang mau dijadikan final,
     jangan langsung push menimpa.
4. Kalau tidak ada perubahan lain di remote, lanjutkan push seperti biasa (tetap beri
   kalimat perhatian singkat di poin 2).

## Konvensi teknis proyek (ringkas)

- Backend: Supabase (`ruvvximnnacpvvoogbzs.supabase.co`), tabel `outage_records` /
  `outage_assets`.
- `shared.js` — dependency bersama: database, kompresi gambar, overlay anotasi, autosave.
- Export PDF pakai jsPDF + jspdf-autotable, dengan pola standar `drawBg` / `willDrawPage`
  untuk background/header/footer tiap halaman. Saat pakai `autoTable`, selalu set
  `margin.top` dan `margin.bottom` (bukan cuma `left`/`right`) supaya halaman lanjutan
  tabel tidak menutupi header/footer background.
- Checkbox tercetak di PDF **jangan** pakai karakter unicode (`\u2713` dkk) sebagai teks —
  font standar jsPDF (helvetica) tidak mendukungnya dan akan tercetak sebagai titik.
  Pakai helper `drawCheckboxBs(doc, x, y, w, h, checked, tone)` yang menggambar kotak +
  centang secara vektor (lihat implementasi di `cems_calibration.html` atau
  `coal_feeder_calibration.html`).
- Semua akses localStorage lewat wrapper aman `_ls`.
- File referensi yang jadi acuan pola-pola di atas: `so2.html`, `opacity.html`,
  `maintenance_report_form.html`, `cems_calibration.html`.
- Untuk fitur galeri foto dengan crop/edit ulang (`cropAndSave()` dan sejenisnya): foto
  yang di-re-crop harus diganti **di posisi/index yang sama** di array (`splice(idx, 1,
  entry)`), JANGAN dihapus lalu ditambahkan ke akhir array — itu menyebabkan foto pindah
  urutan sementara keterangan (caption) yang disinkron ulang dari DOM berdasarkan index
  jadi tertukar.
- Lihat juga `FITUR_REUSABLE_REFERENCE.md` di root repo ini untuk daftar fitur reusable
  (kategori A–I) yang sudah distandardisasi lintas file.

## Notifikasi Telegram (ditambahkan 2026-08-29)

- Bot: **PMUnit7NotifBot**. Grup notifikasi aktif saat ini: **"Submit Report EIC7"**
  (chat_id `-5393795985`). Grup lama "PM Unit 7 Notif Bot" (`-5307120643`) **rusak** —
  API selalu balas sukses tapi pesan tidak pernah benar-benar muncul di klien Telegram
  manapun (sudah diverifikasi lewat DM langsung ke bot vs ke grup itu). Kalau notifikasi
  berhenti masuk lagi dan grup baru ini juga bermasalah, curigai hal yang sama — solusinya
  buat grup baru lagi, bukan debug grup yang sudah "rusak".
- Dua jalur notifikasi, keduanya lewat fungsi Postgres (`security definer`, token BOT
  disimpan di server — **jangan pernah** ditempel langsung ke file HTML/JS, itu pernah
  bocor ke commit GitHub publik):
  - `notify_telegram_submission()` — trigger `AFTER INSERT/UPDATE` di `pm_records`,
    jalan saat `status` berubah jadi `SUBMITTED`.
  - `notify_telegram_review_status(p_row_id text, p_status text, p_modul text, p_pic
    text, p_wo text)` — RPC, dipanggil dari `history.html` (`raSendTelegramNotif`) saat
    status Firestore (reviewed/approved/returned_to_technician) berubah. **`p_row_id`
    harus di-cast `::uuid`** sebelum dibandingkan ke kolom `id` (pernah error type
    mismatch `uuid = text`). Kolom `ra_notified_status` di `pm_records` mencegah kirim
    ulang untuk status yang sama.
  - Setelah `create or replace function` di SQL Editor, kalau RPC balas `PGRST202`
    (function not found di schema cache), jalankan `NOTIFY pgrst, 'reload schema';`.
  - Kalau RPC balas `permission denied`/tidak ketemu meski fungsinya ada: jalankan ulang
    `grant execute on function notify_telegram_review_status(text,text,text,text,text)
    to anon;` — grant tidak otomatis ikut kalau signature fungsi berubah sedikit saja.

## Jaminan foto SELALU sampai ke Google Drive (ditambahkan 2026-08-29)

- **Semua** jalur yang menulis kolom `data` di `pm_records` WAJIB memanggil
  `_pmEnsureAllPhotosOnDrive(rec.data, modul)` (retry upload ke Drive sampai 3x) SEBELUM
  `_pmStripBase64ForSave(rec.data)`. Tiga jalur yang ada sekarang — `dbSave()`,
  `dbSaveSilent()` (autosave), `raResaveInPlace()` (edit-in-place) — sudah konsisten
  begini. **Kalau menambah jalur simpan baru, pola ini WAJIB diikuti** — pernah ada
  ratusan foto (~190MB) nyangkut sebagai base64 mentah di Supabase gara-gara
  `dbSaveSilent()`/`raResaveInPlace()` skip langkah ini (lihat riwayat perbaikan).
- PATCH yang menandai `firebase_synced_at` (di `raSendFinalPdfToFirebaseDashboard`)
  sekarang pakai retry (`_pmPatchRecordWithRetry`, 3x dengan backoff) — sebelumnya
  fire-and-forget, kalau gagal sekali akibat gangguan jaringan/Supabase sesaat, kolom itu
  gagal terisi SELAMANYA dan `raRetryPendingFirebaseSyncs()` (jalan otomatis 3 detik
  setelah halaman apa pun dibuka) terus mengira laporan "belum sukses" lalu submit ulang
  dari nol tiap kunjungan — bikin dokumen duplikat di Review Approval Dashboard.
- Kompresi foto adaptif (budget ~1MB per galeri, kualitas JPEG turun bertahap
  0.9→0.25, fallback downsize dimensi) **sudah ada** di sistem crop — lihat
  `FITUR_REUSABLE_REFERENCE.md` Fitur J. Tidak perlu ditambah lagi kalau modul baru
  sudah pakai crop modal standar dari `shared.js`.
