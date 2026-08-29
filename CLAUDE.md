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
  (chat_id **`-1004351464598`**, tipe `supergroup`). Grup lama "PM Unit 7 Notif Bot"
  (`-5307120643`) **rusak** — API selalu balas sukses tapi pesan tidak pernah benar-benar
  muncul di klien Telegram manapun (sudah diverifikasi lewat DM langsung ke bot vs ke grup
  itu). Kalau notifikasi berhenti masuk lagi dan grup baru ini juga bermasalah, curigai
  hal yang sama — solusinya buat grup baru lagi, bukan debug grup yang sudah "rusak".
- ⚠️ **Grup Telegram biasa (basic group) bisa "naik level" jadi supergroup KAPAN SAJA**
  (dipicu Telegram sendiri, bukan sesuatu yang kita kontrol) — begitu itu terjadi,
  **chat_id LAMA langsung tidak berlaku SELAMANYA**, `sendMessage` balas error 400 "group
  chat was upgraded to a supergroup chat" beserta `migrate_to_chat_id` (chat_id baru,
  format `-100xxxxxxxxxx`). Ini penyebab paling mungkin kalau notifikasi yang tadinya
  jalan normal tiba-tiba berhenti total tanpa perubahan kode apa pun — cek dengan test
  `sendMessage` manual ke chat_id yang tersimpan, baca field `migrate_to_chat_id` di
  error-nya kalau ada, lalu update chat_id di KEDUA fungsi Postgres di bawah.
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
- Kompresi foto adaptif (budget **500KB per galeri** — lihat catatan revisi budget di
  bawah, kualitas JPEG turun bertahap 0.9→0.25, fallback downsize dimensi) **sudah ada**
  di sistem crop — lihat `FITUR_REUSABLE_REFERENCE.md` Fitur J. Tidak perlu ditambah lagi
  kalau modul baru sudah pakai crop modal standar dari `shared.js`.

## Duplikat di Review Approval Dashboard (diperbaiki 2026-08-29)

- **Akar masalah sebenarnya (2 lapis, keduanya sudah diperbaiki):**
  1. `raSendFinalPdfToFirebaseDashboard()`/`window._raPdfCapture` dulu SELALU panggil
     `DB.save()` (Firestore `.add()`, bikin dokumen baru) tanpa cek dulu apakah record ini
     sudah punya `firebase_checksheet_id` dari percobaan sebelumnya. Sekarang: kalau sudah
     ada, pakai `DB.update()` (reuse dokumen yang sama) + `Approvals.getByChecksheetId()`
     buat reuse `approvals` doc juga (`existingApprovalId`). `firebase_checksheet_id`
     sekarang disimpan ke Supabase SEGERA setelah didapat (bukan nunggu seluruh proses
     submit sukses) supaya reuse ini tetap jalan walau upload PDF-nya gagal di tengah.
  2. `raSubmitReportAuto()` (dipanggil tiap retry, baik otomatis maupun tombol Resubmit)
     sempat SELECT record dari Supabase TANPA kolom `firebase_checksheet_id` — jadi
     reuse-logic di poin 1 tidak pernah aktif untuk jalur retry walau kodenya sudah benar.
     **Kalau nambah query serupa (ambil record by id buat proses submit/retry), WAJIB
     sertakan `firebase_checksheet_id` di `select=`.**
- **Bug race-condition terpisah** (juga sudah diperbaiki): `finish()` di
  `raSendFinalPdfToFirebaseDashboard` dulu fire-and-forget PATCH `firebase_synced_at` lalu
  LANGSUNG lapor "selesai" ke parent/opener — yang lalu buru-buru menutup tab/iframe
  SEBELUM PATCH-nya benar-benar sampai ke server, request-nya ikut terputus. Sekarang
  `finish()` **menunggu** (`.then()`) semua PATCH penting selesai dulu sebelum panggil
  `onDone()`. **Kalau menambah langkah baru di `finish()`/alur submit, WAJIB tetap
  di-`await`/`.then()`, jangan fire-and-forget** — itu penyebab pasti laporan yang secara
  logis sudah sukses tapi status tetap "Menunggu Feedback" selamanya.

## Tabel `pm_sync_log` + tab Diagnosis (ditambahkan 2026-08-29)

- Tabel `pm_sync_log` (RLS **disabled**) mencatat SETIAP percobaan kirim ke Review
  Approval Dashboard (sukses/gagal), lewat `_pmLogSyncAttempt()` di `shared.js` — dipanggil
  dari `finish()` (kasus normal) DAN dari `window._raAutosubmitReport` (jaring pengaman
  kasus macet total sebelum sempat sampai ke `finish()` — JS error, promise gagal,
  watchdog 4.5 menit). Auto-dedupe per page-load lewat `window._pmSyncLoggedThisAttempt`.
- Kolom `trigger_source` (`'auto'` vs `'manual'`) dibedakan dari ada/tidaknya
  `&autoclose=1` di URL `?autosubmit=1` — cuma tombol Resubmit manual yang pakai
  `autoclose=1`, retry otomatis latar belakang (iframe tersembunyi) tidak pernah.
- `history.html` punya tombol **"🩺 Diagnosis"** (+ popup otomatis kalau ketemu masalah
  saat halaman dibuka) yang baca tabel ini — HANYA menampilkan record yang punya minimal
  1 baris log `trigger_source='auto'` (dikirim ulang TANPA user menekan apa pun) DAN
  `firebase_synced_at` masih kosong (belum sync). Record yang cuma di-resubmit manual
  berkali-kali oleh user sendiri, atau yang sudah sync sukses, TIDAK ditampilkan —
  sengaja, itu bukan bug yang perlu diberitahukan.

## ⚠️ Budget kompresi foto (500KB) TIDAK terpusat — harus diubah di SETIAP file (diperbaiki 2026-08-29)

- `shared.js` punya fungsi generik `imgCompressAndStore()` dengan budget **500KB per
  galeri** (`MAX_TOTAL = 500 * 1024`) — TAPI **hampir tidak ada file modul yang benar-benar
  memanggil fungsi ini**. Alih-alih, setiap file modul (`so2.html`, `opacity.html`, semua
  `beltscale-*.html`, `form_o2_report.html`, `weekly_calibration_o2_*.html`, dst.) punya
  **salinan kode kompresi sendiri-sendiri** (fungsi lokal `cropAndSave()` dan
  `puCompressFullImage()`/sejenisnya, masing-masing dengan variabel lokal `var MAX = ...`).
- Akibatnya: waktu budget diturunkan dari 1MB ke 500KB, perubahan itu **cuma pernah
  diterapkan ke fungsi shared-nya**, dan seluruh 20 file modul yang ada saat itu tetap
  diam-diam di 1MB — tidak ketahuan sampai diperiksa manual satu per satu. Sudah diperbaiki
  (semua 20 file disamakan ke `500*1024`), tapi **akar masalahnya (duplikasi kode, bukan
  panggil fungsi shared) belum dibenahi**.
- **Kalau budget ini perlu diubah lagi di masa depan**: JANGAN cuma ubah
  `imgCompressAndStore()` di `shared.js` — itu tidak akan berefek ke modul manapun. Harus
  cari SEMUA kemunculan `var MAX = ` (ada 1-2 per file, satu di jalur crop-save satu lagi
  di jalur multi-upload langsung) di seluruh file `.html` dan ubah satu-satu, atau — lebih
  baik — migrasikan semua file supaya benar-benar memanggil `imgCompressAndStore()` dari
  `shared.js` (belum pernah dilakukan, ini technical debt yang masih ada).

## Restrukturisasi modul O2: popup Inlet/Outlet Weekly + rename modul (2026-08-29)

- Popup O2 di `index.html` (dipicu klik card MOD-01) sekarang punya 3 opsi, bukan 2:
  **PM O2 Inlet Weekly** → `weekly_calibration_o2_inlet.html`, **PM O2 Outlet Weekly** →
  `weekly_calibration_o2_outlet.html`, dan **Report PM Monthly O2 Inlet & Outlet** (tetap
  `form_o2_report.html`, filename tidak berubah).
- Modul yang dikirim `form_o2_report.html` (Monthly) ke `history`/Review Approval Dashboard
  diganti dari `"O2 Inlet"`/`"O2 Outlet"`/`"O2 Inlet & Outlet"` jadi
  `PM_O2_MONTHLY_CLEANING` dengan suffix dinamis berdasarkan channel yang benar-benar
  diisi (`o2ChannelEnabled`) saat submit: `_INLET`, `_OUTLET`, atau
  `_INLET_DAN_OUTLET` (lihat `dbCollectData()` di file itu).
- 2 file baru `weekly_calibration_o2_inlet.html`/`_outlet.html` mengirim modul tetap
  (tidak dinamis): `PM_O2_WEEKLY_INLET` / `PM_O2_WEEKLY_OUTLET`.
- `normalizeModul()` di `shared.js` **HARUS** cek substring `WEEKLY_INLET`/`WEEKLY_OUTLET`
  **SEBELUM** cek substring generik `'O2'` (pola yang sama seperti proteksi
  GENERATOR/STATOR vs FEGT yang sudah ada duluan) — kalau tidak, modul Weekly ikut
  ke-normalize jadi `'O2'` biasa dan `raModulToUrl()` salah membuka `form_o2_report.html`
  (file Monthly, struktur data beda total) alih-alih file Weekly aslinya. `RA_MODUL_AREA`
  dan filter tombol baru "O2 Weekly Inlet"/"O2 Weekly Outlet" di `history.html` juga sudah
  ditambahkan.
- Struktur "Dokumentasi Per Channel" di 2 file Weekly baru **BEDA** dari
  `form_o2_report.html` — bukan satu galeri per channel, tapi dipecah jadi beberapa
  section (Calibration Gas Pressure session-level, O2 Readings Before/After, Gas Ratios
  Before, Calibration Readings, Cell Measurements) dengan aturan evidence/keterangan yang
  BEDA per section (ada yang gabungan 1 di bawah tabel, ada yang per-channel, ada yang
  sama sekali tanpa evidence) — mengikuti desain referensi `ahpm.figma.site` sesuai
  instruksi user. Field-field ini SENGAJA disamakan namanya persis dengan skema database
  `kv_store_e669e2e2` milik situs referensi itu (`cellVoltage`, `calibrationO2Span`,
  `gasRatioSpanBefore`, `voltage`, `o2Reading`, dst.) supaya data lama & data baru punya
  bentuk JSON yang identik.
- **64 data historis** (34 sesi Inlet + 30 sesi Outlet) dari database eksternal itu
  (`wvictafepzzrchiywxpk.supabase.co`, tabel `kv_store_e669e2e2`, butuh `service_role` key
  karena `anon` di-lock) sudah dimigrasikan ke `pm_records` sebagai `status: 'draft'`
  (sengaja draft, BUKAN `'SUBMITTED'`, supaya tidak memicu notifikasi Telegram atau submit
  otomatis ke Review Approval Dashboard) dengan `created_at`/`updated_at` di-backdate ke
  timestamp kerja asli. Field yang tidak ada di sumber (Work Order, Asset, foto evidence)
  dibiarkan kosong.
