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
    text, p_wo text)` — RPC, dipanggil dari `history.html` (`raSendTelegramNotif`) DAN
    dari `scripts/notify-ra-status-poll.js` (lihat bagian "Poller notifikasi RA" di
    bawah) saat status Firestore (reviewed/approved/returned_to_technician) berubah.
    **`p_row_id` harus di-cast `::uuid`** sebelum dibandingkan ke kolom `id` (pernah
    error type mismatch `uuid = text`).
    - **Klaim ATOMIK sebelum kirim** (`update pm_records set ra_notified_status = p_status
      where id = ...::uuid and ra_notified_status is distinct from p_status returning id`)
      — WAJIB tetap begini, JANGAN diubah jadi "kirim dulu baru tandai belakangan". Dua
      pemanggil (browser + poller GitHub Actions) bisa jalan bersamaan buat baris yang
      sama; klaim atomik ini yang memastikan cuma SATU yang benar-benar kirim ke
      Telegram, yang lain otomatis berhenti di baris `if claimed_id is null then return`.
      Pernah kejadian tanpa ini: 6 notif Telegram identik terkirim sekaligus (lihat
      insiden 2026-08-30 di bawah).
    - **SENGAJA fire-and-forget** (`perform net.http_post(...)`, tidak menunggu/mengecek
      `net._http_response`) — pernah dicoba pakai loop `pg_sleep` buat nunggu konfirmasi
      sukses sebelum menandai `ra_notified_status` (biar ada retry kalau gagal), tapi ini
      menahan koneksi database sampai beberapa detik per panggilan dan waktu kejadian
      duplikat di atas (6 panggilan bersamaan × beberapa detik masing-masing) memicu
      peringatan "exhausting multiple resources" dari Supabase. **JANGAN tambahkan lagi
      pola tunggu/`pg_sleep` di fungsi ini** — kalau butuh jaminan retry, taruh di
      `scripts/notify-ra-status-poll.js` (jalan di GitHub Actions, tidak menahan koneksi
      Supabase sama sekali) bukan di dalam fungsi Postgres-nya.
    - **Pernah rusak total** (2026-08-30): literal JSON header di `net.http_post`
      ketulis `'{""Content-Type"": ""application/json""}'::jsonb` (tanda kutip dobel,
      bukan `""` artifact copy-paste — itu memang isi asli fungsinya) → `::jsonb` selalu
      gagal cast → fungsi crash SEBELUM sempat kirim HTTP apa pun DAN sebelum sempat
      update `ra_notified_status` → status reviewed/approved sama sekali tidak pernah
      terkirim, tanpa ada baris error yang kelihatan dari sisi client (cuma `.catch()`
      diam-diam). Ketahuan lewat `select pg_get_functiondef(oid) from pg_proc where
      proname=...` lalu tes langsung RPC-nya (dapat error 400 `invalid input syntax for
      type json`). Kalau notifikasi reviewed/approved berhenti total lagi tanpa sebab
      jelas, cek dulu apakah literal JSON di fungsi ini utuh (`'{"Content-Type": ...}'`,
      SATU tanda kutip, bukan dobel) sebelum curiga hal lain.
    - Kolom `ra_notified_status` di `pm_records` mencegah kirim ulang untuk status yang
      sama (dan sekarang JUGA berfungsi sebagai "kunci" klaim atomik di atas).
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

## Revisi Weekly O2 Inlet/Outlet + Numpad Custom (2026-08-30)

- **Technician 1/2/3 dihapus** dari `weekly_calibration_o2_inlet.html` &
  `_outlet.html` — cukup field **PIC** (sekarang pakai `list="o2TechList"`, datalist yang
  tadinya buat technician dipakai ulang buat PIC).
- **Asset & Asset Description otomatis terisi** (readonly) dari tag channel statis
  (`O2_CHANNELS`/`O2_OUTLET_CHANNELS`) lewat `o2UpdateAssetFromChannels()` — dipanggil
  sekali saat init, BUKAN lagi lewat `oninput` di kolom tag (kolom tag editable-nya sudah
  dihapus dari UI, lihat poin berikutnya).
- **Section "Channel Tags" (editable) dihapus dari tampilan** — `buildO2TagGrid()` dan
  elemen `#o2TagGrid` sudah tidak ada. Data tag tag tetap dipakai secara internal dari
  array statis `O2_CHANNELS`/`O2_OUTLET_CHANNELS` (`o2ChannelTag()` sekarang selalu
  fallback ke tag statis, tidak baca DOM lagi).
- **Frequency Maintenance chips dihapus** — `Work To Be Done` sekarang **fixed/readonly**,
  otomatis diisi konstanta `O2_WORK_TO_BE_DONE` (`"Weekly Calibration of Oxygen Analyzer
  (Inlet — 8 Channel)"` / `"(Outlet — 6 Channel)"`) saat init & saat `resetAll()`.
- **Label channel** di semua tabel/kartu sekarang pakai helper `o2ChLabel(c)` (bukan
  `o2ReadingsChannelCode(c.tag)` langsung) — hasilnya `"<kode tag> (Channel N)"`. Dipakai
  konsisten di UI (`o2-channel-head-num`, `<td>` tabel) DAN di PDF (`safe(o2ChLabel(c))`).
  **Kalau nambah tabel/kartu channel baru di file ini, WAJIB pakai `o2ChLabel(c)`**, jangan
  balik ke `o2ReadingsChannelCode(c.tag)` polos — user secara eksplisit minta nomor
  channel selalu kelihatan supaya tidak ambigu dengan kode tag yang mirip-mirip.
- **Khusus Outlet**: Section "O2 Reading" + "Cell Measurements" yang tadinya terpisah
  (2 section beda, evidence cuma di O2 Reading) sekarang **digabung jadi satu kartu per
  channel** (`buildO2ChannelCards()`, ganti `buildO2ReadingTable()` +
  `buildO2ReadingEvidenceGrid()` + `buildO2CellMeasGrid()`) — field O2 Reading + Voltage +
  Temp + Lifetime + Resistance + Keterangan + Evidence semuanya dalam 1
  `.o2-channel-card`. ID field & key galeri foto (`reading_och{id}`) TETAP SAMA seperti
  sebelumnya supaya data lama tetap kompatibel. Section "Calibration Gas Pressure (Session
  Level)" di Outlet yang tadinya TANPA Keterangan/Evidence sekarang punya keduanya (galeri
  baru, key `pressure`, sama polanya seperti di Inlet yang sudah lebih dulu punya ini —
  **wajib** tambahkan `o2SyncCaptions('pressure', 'evidence')` di `o2SyncAllCaptions()`
  kalau bikin galeri baru serupa, gampang kelewat.
- **Numpad custom** (`pmNumpadInit()`/`pmNumpadOpen()`/`pmNumpadPress()` di `shared.js`,
  styling di `shared.css` — cari `NUMPAD CUSTOM`) menggantikan keypad angka bawaan HP yang
  tidak punya tombol minus (keypad OS tidak bisa diubah dari kode web sama sekali, ini
  sengaja dibuat sebagai pengganti, bukan modifikasi keypad bawaan). Field yang mau pakai
  ini: ganti `type="number" inputmode="decimal" step="any"` jadi `type="text"
  inputmode="none" readonly class="pm-num-input"` (oninput= bawaan tetap jalan karena
  `pmNumpadPress()` dispatch event `'input'` manual), lalu panggil `pmNumpadInit()` sekali
  di init halaman. Tombol "Next →" pindah ke field `.pm-num-input` berikutnya yang
  kelihatan di DOM (urutan render halaman, BUKAN urutan tab index), berubah jadi
  "✓ Selesai" otomatis kalau sudah di field terakhir. `pmNumpadOpen()` auto-scroll layar
  (`pmNumpadEnsureVisible()`) kalau field aktif bakal ketutup numpad yang muncul dari
  bawah — hitungannya pakai posisi AKHIR numpad (`window.innerHeight - pad.offsetHeight`),
  bukan posisi live saat animasi slide-up masih jalan, supaya perhitungannya akurat.
  Sudah dipasang di kedua file Weekly O2 (semua kolom angka). **Belum** dipasang di
  file modul lain — kalau mau dipasang di file lain, pola konversinya sama persis, tinggal
  ganti atributnya + panggil `pmNumpadInit()`.

## history.html: auto-refresh, jam status, & debug notifikasi RA (2026-08-30)

- **Tombol Refresh manual + auto-refresh tiap 20 detik** (`pmHistRefresh()`,
  `setInterval(...,20000)`, berhenti kalau `document.hidden`) — REFRESH DATA SAJA
  (`container.innerHTML` diganti langsung), bukan `location.reload()`. `loadHistory(modul)`
  (dipanggil pas ganti filter) beda dari `pmHistRefresh()` (dipanggil tombol/timer, filter
  ikut `pmHistCurrentFilter` yang terakhir dipakai) — keduanya berbagi
  `historyRowsToTableHtml(rows)` supaya tidak duplikasi kode render tabel.
- Tombol Refresh & Diagnosis di topbar jadi **icon-only di layar <600px** (teks
  `.pm-hist-btn-label` & label waktu `.pm-hist-refresh-label` disembunyikan) — sebelumnya
  full teks + label waktu bikin baris topbar overflow sampai `.live-dot` di ujung kanan
  kepotong invisible (topbar `display:flex` tidak wrap, tidak ada overflow handling).
  **Kalau nambah tombol lagi di topbar-right halaman mana pun**, cek dulu di viewport
  sempit (<400px) supaya tidak kejadian sama.
- `historyRaStatusBadge()` sekarang terima objek `appr` UTUH (bukan cuma string status)
  supaya bisa tampilkan jam kejadian status di bawah badge (`review.reviewedAt` /
  `approval.approvedAt` / `returnedNote.returnedAt` dari dokumen `approvals` Firestore,
  format `DD/MM/YYYY HH:MM` lewat `pmFmtDDMMYYYYHHMM()`).
- `pmNotifAttempted` (in-memory, key `id+':'+status`) di `historyUpgradeStatusBadges()`
  — lapis pengaman KEDUA (yang utama ada di database, lihat klaim atomik
  `notify_telegram_review_status` di atas) supaya dalam satu sesi tab yang sama, pasangan
  (id, status) yang sama tidak dicoba kirim berkali-kali gara-gara beberapa siklus
  refresh/loadHistory jalan berdekatan.

## Poller notifikasi RA (GitHub Actions) — lapis kedua tanpa perlu buka history.html (2026-08-30)

- **Masalah**: notifikasi Telegram reviewed/approved/returned_to_technician SEPENUHNYA
  bergantung ada browser yang buka `history.html` (baik manual maupun auto-refresh 20
  detik di atas) — status review/approval ada di **Firestore** (Review Approval
  Dashboard, repo terpisah, TIDAK boleh diubah — lihat instruksi user), Supabase tidak
  otomatis tahu kalau ada perubahan di sana. Kalau tidak ada satu pun tab yang terbuka,
  notifnya menggantung tanpa batas waktu sampai ada yang buka.
- **Solusi**: `scripts/notify-ra-status-poll.js` (Node, tanpa dependency npm — pakai
  `fetch` bawaan Node 20+) dijadwalkan lewat `.github/workflows/ra-notify-poll.yml`
  (`cron: '*/5 * * * *'`, tiap 5 menit, + `workflow_dispatch` buat trigger manual). Jalan
  di server GitHub, BUKAN nambah beban compute Supabase — ambil `pm_records` yang punya
  `firebase_checksheet_id`, query koleksi `approvals` Firestore langsung lewat REST API
  (**koleksi ini ternyata bisa dibaca publik tanpa auth** — sudah diverifikasi lewat curl
  langsung pakai `apiKey` dari `firebase-config.js` saja, TANPA Firebase ID token/service
  account; kalau suatu saat security rules Firestore-nya diperketat jadi butuh auth,
  script ini akan mulai gagal dan perlu pendekatan lain), lalu panggil RPC
  `notify_telegram_review_status` yang sama persis dipakai `history.html`.
- **Aman dijalankan bersamaan dengan `history.html`** — TIDAK perlu logika "kalau ada yang
  buka history, poller ini skip" atau semacamnya. Keduanya ujung-ujungnya manggil RPC yang
  sama, dan klaim atomik di RPC itu (lihat bagian Notifikasi Telegram di atas) yang
  menjamin siapa pun yang lebih dulu sampai akan mengunci duluan, yang satunya otomatis
  berhenti tanpa kirim ulang — TIDAK ada dedup logic tambahan yang perlu ditulis di script
  ini.
- Trade-off: delay sampai ~5 menit (minimum granularity cron GitHub Actions, kadang lebih
  lama lagi kalau runner sedang antre) — jauh lebih baik daripada "sampai ada yang buka
  history.html" (bisa berjam-jam), tapi bukan real-time. Kalau butuh lebih cepat dari 5
  menit, GitHub Actions cron tidak bisa — perlu pendekatan lain (mis. Supabase pg_cron +
  Firestore REST query langsung dari Postgres, jauh lebih kompleks, belum dibuat).

## Alert kesehatan Supabase lewat script poller yang sama (ditambahkan 2026-08-30)

- Awalnya mau pakai **UptimeRobot** (monitoring uptime eksternal, ping `/auth/v1/health`)
  supaya ada yang tahu kalau Supabase down walau tidak ada yang buka aplikasi sama sekali
  — **dibatalkan**, ternyata integrasi Telegram-nya fitur **berbayar** di paket free
  UptimeRobot ("Available only in Solo, Team and Scale"). Jangan disarankan lagi ke user
  kecuali mereka memang mau upgrade paket berbayar itu.
- **Solusi yang dipakai**: `checkAndAlertSupabaseHealth()` di
  `scripts/notify-ra-status-poll.js` (script poller GitHub Actions yang sama dengan di
  atas) — ngecek `/auth/v1/health` (butuh header/query `apikey`, TANPA itu selalu balas
  401 walau sehat, lihat bagian Notifikasi Telegram) tiap kali script jalan (~5 menit),
  kirim Telegram **LANGSUNG** ke `api.telegram.org` (BUKAN lewat RPC
  `notify_telegram_review_status`) kalau status berubah jadi unhealthy/stopped — sengaja
  begitu karena kalau Supabase-nya sendiri yang down, RPC yang notify_telegram_review_status
  (jalan DI DALAM Supabase) ikut tidak bisa dipanggil, jadi tidak bisa dipakai buat
  "memberi tahu Supabase sedang down". `main()` langsung `return` kalau Supabase down
  (skip proses cek notifikasi RA di bawahnya, pasti gagal juga).
- **Token bot di script ini WAJIB dari GitHub Secret** (`TELEGRAM_BOT_TOKEN`, dibaca lewat
  `process.env`), **JANGAN PERNAH** ditulis langsung di file — repo ini **PUBLIC**
  (`private: false`, sudah diverifikasi lewat GitHub API), dan sudah pernah ada insiden
  token bocor ke commit publik gara-gara ditempel langsung (lihat bagian paling atas soal
  Notifikasi Telegram). Set lewat GitHub web: Settings → Secrets and variables → Actions →
  New repository secret. Tanpa secret ini, bagian alert-kesehatan cuma nge-log error ke
  Actions log (tidak crash), bagian notifikasi reviewed/approved yang lewat RPC tetap
  jalan normal (itu tidak butuh token di sini sama sekali).
- **Anti-spam episode** pakai file `.health-state.json`, dipersist lintas run lewat
  `actions/cache@v4` dengan pola `key: health-state-${{ github.run_id }}` +
  `restore-keys: health-state-` (key SELALU unik per run supaya SELALU tersimpan ulang di
  akhir job — cache biasa cuma nyimpen sekali per key exact-match, tidak overwrite; ini
  pola standar buat "mutable state" via GitHub Actions cache). Alert down cuma sekali per
  episode (dari pertama kali down sampai balik ok), plus kirim pesan "sudah kembali
  normal" begitu pulih — **mirror** persis logika banner `pmHandleHealthResult()` di
  `shared.js` (in-app), cuma bedanya ini persisten lewat cache file, yang di browser lewat
  `pmLS`/localStorage.

## Mode Revisi (tombol "Revisi" untuk laporan returned_to_technician, 2026-08-30)

- **BUKAN** tombol Resubmit yang sudah ada (`historySubmit()` di `history.html`, khusus
  laporan yang SUBMIT PERTAMA-nya gagal nyampe ke Review Approval Dashboard,
  `firebase_synced_at` masih kosong) — ini kasus BEDA: laporan yang sudah SEMPAT
  direview lalu **dikembalikan** ke teknisi (`status: 'returned_to_technician'` di
  dokumen `approvals` Firestore).
- `history.html`: baris dengan status real (dari `historyUpgradeStatusBadges()`)
  `returned_to_technician` dapat tombol **"📝 Revisi"** tambahan (disisipkan ke
  `#histActionCell-{id}`, id ini WAJIB ada di `<td>` Aksi row template) — klik-nya cuma
  buka halaman modul yang sama seperti tombol "Buka" (`modulToUrl(r.modul, r.id)`).
  Kecerdasannya ada di halaman modul-nya sendiri, bukan di tombolnya.
- `shared.js`: `pmMaybeEnterRevisionMode(rec)` — dipanggil dari blok "LOAD FROM HISTORY"
  tiap file modul (satu baris tambahan: `pmMaybeEnterRevisionMode(rec);` persis setelah
  `applyRecordToForm(rec, id);`), cek status Firestore sungguhan lewat
  `Approvals.getByChecksheetId(rec.firebase_checksheet_id)`. Kalau
  `returned_to_technician`: cari tombol Submit Laporan lewat selector generik
  `button[onclick*="raSubmitReport()"]` (SEMUA 19 file modul yang punya `raSubmitReport()`
  pakai pola onclick yang sama persis, sudah diverifikasi lewat grep — **kalau bikin file
  modul baru, WAJIB ikuti pola `onclick="window._raBuildPdf=<fn>; raSubmitReport()"`**
  supaya selector ini tetap ketemu), ganti labelnya jadi **"Revisi Selesai dan Resubmit"**,
  dan **kunci (`disabled`)** sampai user Simpan ke Database ulang.
- `pmMarkRevisionSaved()` dipanggil dari `dbSave()` sesudah sukses simpan — kalau
  `pmRevisionMode` aktif, buka kunci tombolnya (karena data yang tersimpan sudah pasti versi
  revisi terbaru, bukan data lama). **Kalau menambah jalur simpan baru selain `dbSave()`
  yang perlu mendukung alur revisi ini, WAJIB panggil `pmMarkRevisionSaved()` juga sesudah
  sukses** — lupa panggil ini = tombol permanen terkunci walau sudah disimpan.
- **Baru dipasang di 2 file** (`weekly_calibration_o2_inlet.html` &
  `weekly_calibration_o2_outlet.html`) — belum dilebarkan ke 17 file modul lain yang juga
  punya `raSubmitReport()`. Kalau mau dilebarkan: tinggal tambah baris
  `pmMaybeEnterRevisionMode(rec);` di blok "LOAD FROM HISTORY" masing-masing file (pola
  sama persis, lihat 2 file di atas sebagai referensi) — mekanismenya sendiri sudah
  generik di `shared.js`, tidak perlu diubah.
- **Terverifikasi langsung dari source Review Approval Dashboard** (dibaca read-only dari
  `github.com/EenPutra/CHECK-SHEET-POMI-ELEKTRIK-ONLINE`, TIDAK diubah): `status:
  'submitted'` yang dikirim `submitWithFiles()` saat resubmit (lihat poin sebelumnya)
  MEMANG persis status yang mereka harapkan untuk menandai "laporan baru, timpa yang
  lama" — komentar asli mereka: *"status is deliberately reset to 'submitted' here
  regardless of what it already was, since an overwrite always means the technician has
  new data for you to look at."* Field `returnedNote` (dari kejadian returned
  sebelumnya) **TIDAK ikut dihapus** saat resubmit — cuma di-`.set(...,{merge:true})`,
  jadi field lain yang tidak disebutkan eksplisit (termasuk `returnedNote`) tetap apa
  adanya. Ini justru dimanfaatkan sebagai penanda "revisi" (lihat poin berikutnya).

## Badge & notifikasi "🔁 Revisi Submitted" (2026-08-30)

- Firestore cuma punya status mentah `'submitted'` untuk DUA kejadian yang beda-beda:
  submit pertama kali, ATAU laporan `returned_to_technician` yang sudah direvisi+disubmit
  ulang (status di-reset ke `'submitted'` oleh `submitWithFiles()`, lihat poin di atas).
  Client TIDAK BISA membedakan keduanya dari `status` saja — pembedanya: field
  `returnedNote` (dari kejadian returned sebelumnya) **tetap nempel** di dokumen karena
  update-nya `merge:true`, bukan replace penuh.
- `historyDeriveStatus(appr)` (`history.html`, dan versi Node-nya
  `fetchRecentApprovals()` di `scripts/notify-ra-status-poll.js`) — kalau
  `appr.status === 'submitted' && appr.returnedNote` ada isinya, derive jadi status
  sintetis **`'revision_resubmitted'`** (BUKAN dari Firestore, murni buatan sisi kita).
  Dipakai KONSISTEN untuk badge (`historyRaStatusBadge`, label "🔁 Revisi Submitted",
  ungu, beda dari "Submitted" biru biasa) DAN untuk status yang dikirim ke RPC notify —
  **WAJIB selalu lewat fungsi derive ini, jangan baca `appr.status` mentah langsung** di
  tempat lain yang perlu bedakan submit-pertama vs revisi-resubmit, supaya badge & notif
  tetap sinkron.
- `notify_telegram_review_status` (fungsi Postgres) juga punya case `'revision_resubmitted'`
  → label `'🔁 Direvisi & Disubmit Ulang'`. **Ini status SINTETIS, bukan nilai asli
  Firestore** — kalau baca ulang fungsi ini di masa depan dan bingung kenapa ada case
  yang "tidak match status Firestore mana pun", ingat ini alasannya.

## Investigasi egress Supabase & `payload_size` yang bisa BASI (2026-08-30)

- Sempat dicurigai 6-8 draft (`pm_records.status='draft'`) raksasa (`payload_size` tercatat
  sampai 20MB) jadi penyebab overage egress bulanan (5GB limit, kepakai 6.06GB) — **investigasi
  lebih lanjut membuktikan ini SALAH**. Dicek langsung: ukuran `data` SEBENARNYA record-record
  itu cuma 1-25KB, jauh dari angka `payload_size` yang tercatat. **Kolom `payload_size` bisa
  BASI/tidak mencerminkan ukuran `data` yang sebenarnya sekarang** — kemungkinan pernah kena
  jalur simpan yang meng-update `data` tanpa ikut menghitung ulang `payload_size` (dicurigai
  `raResaveInPlace()`, yang PATCH body-nya sengaja TIDAK menyertakan `payload_size` — lihat
  fungsi itu di `shared.js`). **Jangan pernah percaya `payload_size` sebagai indikator "record
  ini masih besar" tanpa verifikasi ulang** (`Buffer.byteLength(JSON.stringify(data))`) — kalau
  butuh cek ukuran data sungguhan, selalu hitung ulang dari `data` mentahnya, bukan baca kolom
  ini langsung. Penyebab PASTI lonjakan egress 27-29 Agustus tidak pernah ditemukan — log API
  Supabase paket Free cuma retensi pendek (~24 jam terlihat di dashboard saat dicek 30 Agustus,
  data tanggal 27-29 sudah tidak ada lagi).

## Jaring pengaman retry upload Drive untuk draft (2026-08-30)

- `scripts/retry-drive-upload.js` + `.github/workflows/retry-drive-upload.yml` (cron tiap jam,
  menit :17) — **bukan buat masalah yang sudah ada sekarang** (lihat poin di atas, terbukti
  belum ada), murni **pencegahan ke depan**: kalau suatu saat ada draft yang foto-fotonya gagal
  ke Google Drive (skenario `dbSaveSilent()` yang sengaja tidak menolak simpan kalau upload
  gagal, lihat catatan panjang di `_pmEnsureAllPhotosOnDrive`/`shared.js`), job ini otomatis
  scan & retry tanpa perlu ada yang buka aplikasi ATAU Claude turun tangan manual lagi.
- **Deteksi LANGSUNG scan isi `data`** (`collectPending()`, logika identik
  `_pmEnsureAllPhotosOnDrive` di `shared.js` — cari `dataUrl` yang masih `'data:...'` TANPA
  `driveUrl`), **SENGAJA TIDAK pakai kolom `payload_size` sebagai filter** — persis karena
  kolom itu terbukti bisa basi (lihat poin di atas). Kalau nanti mau nambah filter/optimasi di
  script ini, JANGAN balik pakai `payload_size` sebagai sinyal "perlu dicek", itu sudah
  terbukti tidak reliable.
- **Scope dibatasi**: cuma `status='draft'` yang di-update dalam 14 hari terakhir
  (`RECENT_DAYS`), limit 50 record per jalan. Record `SUBMITTED` TIDAK di-scan di sini —
  `dbSave()` sekarang sudah menolak simpan kalau upload Drive gagal (lihat riwayat perbaikan
  lama), jadi record submitted baru seharusnya tidak pernah kena kasus ini lagi. Batasan scope
  ini sengaja supaya job-nya sendiri tidak ikut boros egress (baca `data` penuh tiap record
  yang di-scan makan bandwidth juga) — **kalau mau perluas ke SUBMITTED atau histori lebih
  lama, pertimbangkan trade-off egress job-nya sendiri dulu.**
- Endpoint upload SAMA PERSIS dengan yang dipakai browser (`GDRIVE_WEB_APP_URL` +
  `GDRIVE_SECRET_TOKEN`, keduanya sudah publik di `shared.js` client-side, bukan secret
  tersembunyi — BEDA dari `TELEGRAM_BOT_TOKEN` yang wajib GitHub Secret). Berhasil PATCH balik
  juga otomatis membetulkan `payload_size` yang basi (dihitung ulang dari `data` final).

## Mode Revisi & indikator Supabase dilebarkan ke SEMUA file modul (2026-08-30)

- `pmMaybeEnterRevisionMode(rec)` (lihat bagian "Mode Revisi" di atas) sekarang dipasang di
  **semua 19 file modul** yang punya `raSubmitReport()` (sebelumnya cuma 2 file O2 Weekly).
  Satu baris `pmMaybeEnterRevisionMode(rec);` ditambahkan tepat setelah pemanggilan
  `applyRecordToForm(rec, id)`/fungsi restore-record setara di blok "LOAD FROM HISTORY"
  tiap file (nama fungsi restore-nya sendiri bisa beda-beda per file — `applyRecordToForm`
  di kebanyakan file, `hgRestoreRecord` di `pm-hg-analyzer.html`, dll — yang penting
  panggil `pmMaybeEnterRevisionMode(rec)` SETELAH record-nya selesai di-render ke form).
  **Kalau bikin file modul baru dengan fitur load-dari-riwayat, WAJIB tambahkan baris ini
  juga** supaya alur Revisi konsisten di semua tempat.
- `pmFindSubmitButtons()` (plural, `querySelectorAll` — BUKAN `pmFindSubmitButton()`
  singular yang sempat dipakai versi awal) — ditemukan `fegt.html` punya **2 tombol**
  "Submit Laporan" berbeda (2 section/tab dengan alur `_raBuildPdf` beda-beda:
  `sixmDownloadPdf` dan `runDiagnosisAndPrint`). Kalau nambah file modul dengan lebih dari
  1 tombol submit serupa, ini sudah otomatis tertangani (semua tombol yang cocok selector
  `button[onclick*="raSubmitReport()"]` ikut diganti label & dikunci/dibuka bersamaan) —
  JANGAN balik ke `querySelector` (singular), itu cuma akan pegang tombol pertama.
- **Indikator status Supabase (`live-dot`)** sekarang ada di **SEMUA file** (sebelumnya 25
  dari 31 file — index.html sudah ditambahkan sebelumnya, sekarang 5 sisanya:
  `maintenance_report_form.html`, `device-admin.html`, `checksheet-level-switch.html`,
  `outage-index.html`, `outage-indexa.html` juga sudah). Ketiga file terakhir itu tadinya
  pakai `.status-pill::before` (pseudo-element CSS, TIDAK BISA disentuh JS sama sekali) buat
  titik hijaunya — diganti jadi elemen sungguhan `<span class="live-dot">` di dalam
  `.status-pill` supaya `pmCheckSupabaseHealth()` bisa update warnanya. **Kalau ketemu pola
  serupa (titik status pakai `::before`) di file lain di masa depan, WAJIB dikonversi ke
  elemen sungguhan dulu sebelum bisa ikut kebagian indikator ini** — pseudo-element tidak
  pernah bisa di-`querySelectorAll` dari JavaScript.

## Modul trend baru: O2 Weekly Inlet & Outlet + rename hub `trend/index.html` (2026-08-30)

- 2 halaman trend baru mengikuti arsitektur modular yang didokumentasikan di
  `trend/Trend Fitur.MD`: `trend/trend_weekly_o2_inlet.html` (adapter
  `trend/js/adapters/o2-inlet-adapter.js`, tag `trend/config/default-tags-o2-inlet.js` — 8
  channel `O2-INLET-CH1..8`, config modul `trend/config/modules/o2-inlet.config.js`, key
  `O2_WEEKLY_INLET`, `deviationPairs` beforeVsAfter sama pola `so2.config.js`) dan
  `trend/trend_weekly_o2_outlet.html` (adapter `o2-outlet-adapter.js`, tag
  `default-tags-o2-outlet.js` — 6 channel `O2-OUTLET-CH1..6`, config `o2-outlet.config.js`,
  key `O2_WEEKLY_OUTLET`, **`deviationPairs: []` sengaja kosong** karena form Outlet cuma
  punya 1 pembacaan `O2Reading` per channel, tidak ada before/after — `module-view.js`
  sudah aman menangani array kosong ini, panel deviasi otomatis tidak dirender).
  `js/historical-manager.js`/`js/module-view.js` TIDAK disentuh (generik by design).
- Hub `trend/index.html` **di-rename jadi `trend/index_trend.html`** (biar tidak
  membingungkan dengan `index.html` dashboard utama di root) via `git mv` supaya histori
  tetap terjaga. Semua yang mereferensikannya WAJIB ikut diupdate — kalau menambah modul
  trend baru lagi di masa depan, cek 2 tempat ini:
  1. Topbar "DCS TREND" link (`<a href="index_trend.html" class="topbar-home-link">`) di
     SETIAP `trend/trend_*.html` (bukan cuma yang baru dibuat — semua file lama juga harus
     ikut diupdate kalau nama hub berubah lagi nanti).
  2. Kartu "Historical & Live Trend" di root `index.html` (`onclick`) yang mengarah ke
     `trend/index_trend.html`.
  Link balik dari hub ke dashboard utama (`trend/index_trend.html` → `../index.html`,
  tombol "← DASHBOARD UTAMA") sudah benar dari sebelumnya, tidak perlu diubah.
- 2 kartu baru ditambahkan di hub (`O2 WEEKLY INLET` aksen `#0e8f7a`, `O2 WEEKLY OUTLET`
  aksen `#c07a12`), `.hub-stats` diupdate dari 3 modul/43 tag jadi 5 modul/57 tag.

## 9 modul trend baru dari survei "semua HTML yang berpotensi" (2026-08-30)

- User minta cek SEMUA 31 file HTML modul di root, tambahkan `trend_....html` untuk yang
  "berpotensi bisa dijadikan trend". Dari 26 file yang belum punya trend (5 sudah:
  SO2/FEGT/CEMS/O2 Weekly Inlet/Outlet), disurvei satu-satu (baca `dbCollectData()` tiap
  file, BUKAN cuma tebak dari judul/nama file) — **9 berhasil dibangun, 2 dikecualikan,
  sisanya dikecualikan lebih dulu di tahap survei awal** (workflow/admin: `outage-*.html`
  ×5, `checksheet-level-switch.html`, `device-admin.html`, `history.html`, `index.html`;
  bukan tag tetap: `maintenance_report_form.html`, `material-warehouse.html`).
- **Dikecualikan setelah baca isi lengkap** (kelihatannya modul analyzer tapi ternyata
  checklist murni, TIDAK ADA bacaan angka sama sekali):
  - `pm-hg-analyzer.html` — cuma `check`/`sparepart`/`done` boolean per step, tidak ada
    nilai konsentrasi Hg atau kalibrasi gas.
  - `opacity.html` — cuma 11 item checklist boolean (PTW, cleaning, sealing, dst per sisi
    7A/7B), meski file-nya jadi referensi pola PDF bareng `so2.html` di bagian atas
    dokumen ini, struktur DATA-nya beda total, bukan DCS-vs-Local reading.
  - **Pelajaran**: nama modul yang terdengar seperti instrumen ("Analyzer", "Monitor")
    TIDAK menjamin ada data numerik tersimpan — WAJIB baca `dbCollectData()`/struktur
    `data` yang benar-benar disimpan sebelum bikin trend, jangan asumsi dari judul.
  - `checksheet-temperature.html` **JUGA dikecualikan** (beda dari 2 di atas) — bukan
    karena datanya checklist, tapi karena filenya SAMA SEKALI TIDAK PAKAI `pm_records`
    (`function dbCollectData(modul){ return null; }` sengaja dikosongkan) — dia simpan ke
    tabel Supabase terpisah `ts_checksheet` lewat REST call sendiri (`TS_SUPA_URL`/
    `TS_TABLE` lokal di file itu). Arsitektur trend SEKARANG selalu query `pm_records`
    lewat `SupabaseAdapter.fetchByModulAndRange()` (dipanggil generik oleh
    `historical-manager.js` untuk SEMUA adapter terdaftar, tidak ada jalur per-adapter ke
    tabel lain) — dukung modul ini butuh ubah `historical-manager.js`/
    `supabase-adapter.js` supaya adapter bisa declare tabel sendiri, BELUM dikerjakan,
    di luar scope "tambah modul baru" yang biasa.
  - `beltscale.html` (390 baris, beda dari `beltscale-b12/e23/e45.html` yang masing-masing
    2000+ baris) **BUKAN modul terpisah** — dia cuma UI unified yang pakai
    `?type=b12/e23/e45` buat pilih salah satu dari 3 modul yang SAMA (`dbSave('beltscale')`
    dengan `modul` dihitung dinamis jadi salah satu dari `BELT CONVEYOR B1-B2`/`E2-E3`/
    `E4-E5`) — jadi datanya SUDAH otomatis kebaca oleh 3 trend belt scale di bawah, tidak
    perlu trend keempat.
- **9 modul yang berhasil dibangun** (pola sama: adapter di `js/adapters/`, tag di
  `config/default-tags-*.js`, config modul di `config/modules/*.config.js`, halaman di
  `trend_*.html`, key registrasi `DCS_ADAPTERS`/`DCS_MODULES` = literal string
  `pm_records.modul` milik modul itu atau substring aman darinya):
  - `Flow Meter FGD` (dari `Flow Meter FGD Inlet & Quencher`) — 4 tag (FM-101/103/201/203),
    Before/After Cleaning-Correction + Insertion/Profile Factor.
  - `Analyzer Indicator Transmitter (pH)` — 6 tag (CWT-AIT-502/503/507/512/513/936), DCS
    vs Local pH + kalibrasi buffer 4/7/10.
  - `GENERATOR_STATOR_LEAK` — 7 tag/parameter (Flow Rate, Purge Air, IA Pressure, Bottle
    Pressure, DO Probe Life, H2/DO Reading), Before/After per PM.
  - `Coal Feeder Calibration` — **1 tag agregat** (`COAL-FEEDER-CAL`) karena nama feeder
    di form-nya free-text, bukan channel tetap seperti modul lain — deviasi kalibrasi 2
    metode + demand test 100%.
  - `PM_O2_MONTHLY_CLEANING` (dari `form_o2_report.html`, BEDA dari 2 modul Weekly O2 yang
    sudah ada duluan — source file & struktur data beda total) — key ini SENGAJA cuma
    prefix, supaya `ilike.*PM_O2_MONTHLY_CLEANING*` menangkap ketiga varian suffix
    (`_INLET`/`_OUTLET`/`_INLET_DAN_OUTLET`) sekaligus. **Cuma 6 tag sisi Outlet** — sisi
    Inlet di file ini cuma simpan foto before/after cleaning, tidak ada angka O2%
    tersimpan sama sekali (beda dari `weekly_calibration_o2_inlet.html` yang punya
    before/after O2% numerik).
  - `Coal Silo Level Transmitter` — 6 tag (BF-LI-500A–F), DCS Reading As Found vs As Left.
  - `BELT CONVEYOR B1-B2` — 2 tag (Conveyor 100A/100B), 11 series/tag (Zero Cal
    bulanan + Zero/Span Error, Diagnostic Load/Pulse 3-bulanan, dst).
  - `BELT CONVEYOR E2-E3` — 2 tag (Conveyor 200A/200B), pola serupa B1-B2.
  - `BELT CONVEYOR E4-E5` — 2 tag (Conveyor E-4/E-5), lebih sederhana — 3 series/tag
    (Error Zero Calibration %, New/Old Zero Change Value) + 1 deviationPair.
- Hub `index_trend.html`: `.hub-stats` diupdate dari 5 modul/57 tag jadi **14 modul/93
  tag**, 9 kartu baru ditambahkan (aksen warna beda-beda, belum pernah dipakai modul lain:
  `#a35c1f` O2 Monthly, `#1f5c8a` pH, `#1f8a7a` Flow Meter FGD, `#a31e3f` Generator Stator
  Leak, `#3d3d8a` Coal Feeder, `#6b4a2f` Coal Silo Level, `#2f7a3d`/`#7a8a1f`/`#a37a1a`
  untuk 3 Belt Scale).
- Proses build 9 modul ini dikerjakan PARALEL lewat 9 subagent terpisah (masing-masing
  cuma boleh bikin 4 file baru miliknya sendiri, dilarang sentuh `index_trend.html`/CSS/
  JS core bersama supaya tidak ada race/conflict antar subagent) — hub card + `.hub-stats`
  baru dirangkai manual SEKALI di akhir setelah semua subagent selesai, supaya tidak ada
  banyak edit bertumpuk ke file yang sama.

## Review Approval Dashboard nambah status ASLI `'revised'` — fix deteksi revisi kita (2026-08-30)

- Dicek ulang (read-only, clone sementara ke `/c/radash_ro` lalu dihapus lagi, TIDAK pernah
  diubah/push — sesuai instruksi user) `github.com/EenPutra/CHECK-SHEET-POMI-ELEKTRIK-ONLINE`
  atas permintaan user yang curiga ada status baru di sana. **Benar** — commit mereka jam
  16:56 (`a0280cd`, "Review dashboard: admin 'Hapus PERMANEN'...") ternyata membawa rollout
  status `'revised'` (label "Direvisi") yang JAUH lebih besar dari sekadar commit itu:
  `Approvals.submitWithFiles()` sekarang, kalau approval yang di-resubmit sebelumnya berstatus
  `returned_to_technician`, set `status: 'revised'` (bukan lagi `'submitted'`), **mengosongkan**
  `returnedNote` (dipindah ke array baru `returnedHistory[]`, entry lama di-push ke situ), dan
  menambah `revisedAt`/`revisionCount`. `STATUS_LABELS`, badge CSS, dropdown filter,
  `STATUS_ORDER`, `Approvals.isPendingReview()` (`=== 'submitted' || === 'revised'`), dan
  `renderDetail()`'s "Riwayat Revisi" section di sisi mereka semua sudah tahu status ini —
  detail lengkap ada di CLAUDE.md mereka sendiri (`git log`/baris ~1319-1345 versi commit
  `a0280cd`, kalau perlu dicek ulang di masa depan).
- **Ini MEMATAHKAN deteksi revisi kita sendiri** (`historyDeriveStatus()` di `history.html`
  dan `fetchRecentApprovals()` di `scripts/notify-ra-status-poll.js`) — keduanya sebelumnya
  cuma cek `status==='submitted' && returnedNote ada isinya` buat menyimpulkan status sintetis
  `'revision_resubmitted'` kita. Karena `returnedNote` sekarang DIKOSONGKAN pada resubmit
  (dipindah ke `returnedHistory[]`), cek lama itu **tidak akan pernah cocok lagi** untuk
  revisi baru sejak commit itu — badge "🔁 Revisi Submitted" dan notifikasi Telegram-nya akan
  diam-diam berhenti muncul (fallback ke badge "Submitted"/"Menunggu Review" biasa) tanpa
  error yang kelihatan sama sekali.
- **Fix**: kedua fungsi derive itu sekarang cek `appr.status === 'revised'` (real value
  Firestore mereka) LEBIH DULU, baru fallback ke cek `returnedNote` lama (buat dokumen lama
  yang dibuat SEBELUM commit `a0280cd`, yang masih berbentuk `submitted`+`returnedNote`
  nempel). String sintetis internal kita (`'revision_resubmitted'`) SENGAJA TIDAK diganti
  jadi `'revised'` biar RPC Postgres `notify_telegram_review_status` (case-nya masih
  `'revision_resubmitted'`) dan `validStatuses` array TIDAK perlu ikut diubah — cukup
  perlebar deteksinya saja. `historyRaStatusBadge()`'s timestamp juga diupdate: pakai
  `appr.revisedAt` dulu (field baru mereka) baru fallback `appr.updatedAt`.
- **Kalau di masa depan ketemu lagi field/status baru serupa di dashboard mereka** yang
  memengaruhi cara kita membaca `approvals` (dari `history.html` ATAU dari poller GitHub
  Actions) — pola fix-nya sama: WIDEN deteksi (tambah kondisi baru), JANGAN ganti/hapus
  fallback lama, karena dokumen historis lama tetap dalam bentuk lama selamanya (Firestore
  tidak migrasi data retroaktif, cuma tulisan BARU yang ikut format baru).

## Akar masalah SEBENARNYA: `approval-helper.js` kita adalah vendored copy yang basi (2026-08-30)

- Fix "deteksi status revised" di atas TERNYATA belum cukup — dites langsung (submit → admin
  kembalikan → buka "Revisi" → submit ulang), hasilnya approvals doc TETAP jadi
  `status:'submitted'` (bukan `'revised'`) dan `returnedNote` TIDAK ikut dikosongkan/pindah
  ke `returnedHistory[]` seperti seharusnya versi baru mereka. Root cause: `approval-helper.js`
  di root repo INI (dimuat lewat `<script src="approval-helper.js">` di setiap file modul yang
  punya `raSubmitReport()`) adalah **salinan manual (vendored copy)** dari
  `github.com/EenPutra/CHECK-SHEET-POMI-ELEKTRIK-ONLINE`, BUKAN di-fetch live dari repo mereka.
  Salinan kita ketinggalan **200+ baris** (223 baris punya kita vs 355 baris versi terbaru
  mereka saat dicek) — sama sekali tidak punya logic `wasReturned`/status `'revised'`/
  `returnedHistory[]`/`revisionCount` yang dibahas di bagian atas dokumen ini.
- **Diperbaiki**: `approval-helper.js` di-copy ULANG PERSIS dari upstream (diverifikasi dulu
  lewat `diff` bahwa 4 pemanggilan yang kita pakai — `DB.attachFiles`, `DB.save`,
  `Storage.uploadBlob`, `Storage.uploadDataUrl`, `Approvals.getByChecksheetId`,
  `Approvals.submitWithFiles` — semuanya masih kompatibel dengan `db-helper.js`/
  `storage-helper.js` kita yang ada sekarang, jadi aman di-swap TANPA ikut sync 2 file itu).
- ⚠️ **File lain yang JUGA di-vendor manual dari repo EenPutra ternyata SAMA-SAMA sudah basi**
  (dicek pakai `diff` waktu investigasi ini, TAPI BELUM disinkronkan — sengaja di luar scope
  perbaikan kali ini supaya tidak menimpa banyak hal sekaligus tanpa tes menyeluruh):
  `db-helper.js` (842 baris beda), `storage-helper.js` (354 baris beda). `firebase-config.js`
  aman (isinya identik, bedanya cuma LF vs CRLF artifact `diff`, bukan konten). **Kalau nanti
  ada bug aneh lain yang terasa seperti "PM Unit 7 ketinggalan fitur/fix dari Review Approval
  Dashboard"**, curigai dulu file-file vendored ini basi lagi — cek `diff` terhadap clone
  fresh `github.com/EenPutra/CHECK-SHEET-POMI-ELEKTRIK-ONLINE` (baca-saja, JANGAN ubah repo
  itu) SEBELUM debug jauh ke logic kita sendiri. Belum ada mekanisme otomatis buat sync
  file-file vendored ini — semuanya manual `cp` tiap kali ketahuan basi.
- **Pelajaran penting**: cek "apakah logic di sisi kita sudah sinkron dengan status/field
  yang dikirim mereka" itu TIDAK CUKUP kalau logic pengirimnya sendiri (`approval-helper.js`)
  juga vendored dan basi — WAJIB verifikasi file vendored-nya dulu SEBELUM percaya hasil baca
  behavior dari kode kita, karena kode kita bisa saja membaca versi lama yang tidak pernah
  memproduksi field/status baru itu sama sekali.

## Overlay "SEDANG MENSUBMIT" untuk halaman autosubmit (2026-08-30)

- Klik "Submit"/"Resubmit" di `history.html` membuka file modul terkait di tab BARU
  (`window.open`, dengan `?autosubmit=1&autoclose=1` di URL) yang otomatis menjalankan
  proses submit lalu menutup diri sendiri — sebelumnya tab itu sempat menampilkan form
  checksheet mentah selama proses berlangsung, bikin user bingung ("kenapa halaman form
  kebuka sendiri").
- `shared.js` sekarang `document.write()` overlay full-screen (`#pmAutosubmitOverlay`,
  z-index `2147483000`, di bawah z-index gate akses `#pmAuthGate` yang `2147483647` supaya
  gate tetap menang kalau device belum trusted) — spinner CSS-animasi + teks "SEDANG
  MENSUBMIT" + penjelasan "Sistem sedang mensubmit otomatis, halaman akan kembali ke
  riwayat otomatis setelah submit berhasil". Ditulis di IIFE `?autosubmit=1` yang SUDAH ADA
  (jaring pengaman `window._raAutosubmitReport`, lihat bagian atas dokumen ini) — SEBELUM
  early-return-nya lolos, `document.write()` di sini aman karena posisinya sama seperti
  gate akses (`shared.js` masih di tengah parsing `<head>`, `document.body` belum tentu ada).
- Overlay ini otomatis kepakai juga di jalur iframe TERSEMBUNYI (retry background,
  `autosubmit=1` TANPA `autoclose=1`) — harmless, iframe-nya `display:none` jadi tidak
  pernah kelihatan siapa pun, tidak perlu dikecualikan.
- Ada safety-net eksplisit: `window._raAutosubmitReport` (dipanggil pas sukses/gagal/error/
  watchdog) sekarang juga `.remove()` overlay ini duluan sebelum lanjut logic lain — supaya
  kalau `window.close()` gagal/tidak berlaku (mis. dibuka bukan lewat `window.open`, atau
  `window.opener` sudah hilang), overlay TIDAK nyangkut permanen menutupi halaman.
- **Kalau nambah field/state baru buat overlay ini** (mis. teks berubah pas gagal sebelum
  auto-close 6 detik), edit langsung string HTML di `document.write()` itu — jangan bikin
  elemen terpisah, biar tetap satu blok `document.write()` sinkron seperti pola gate akses.

## Chart trend 2x lebih tinggi + Coal Feeder Calibration jadi 6 feeder tetap (2026-08-30)

- **Tinggi grafik trend dinaikkan 2x lipat** di `trend/css/style.css` (`.chart-wrap`) —
  desktop `clamp(380px,55vh,620px)` → `clamp(760px,110vh,1240px)`, breakpoint ≤900px
  `300px`→`600px`, ≤480px `260px`→`520px` — biar garis trend lebih detail/rapat titik
  datanya (request user). `?v=` `style.css` dinaikkan ke `20260830c` di SEMUA 15 halaman
  trend (jangan lupa lagi kalau ubah `style.css`/`dcs-theme.css` lagi — sudah 2x kejadian
  lupa cache-bust sesi ini).
- **`coal_feeder_calibration.html`**: field **Feeder No.** (`#cfFeederNo`) diubah dari
  `<input type="text">` bebas jadi `<select>` TETAP 6 opsi: `7BF-PVR-500A (PULVERIZER 7A)`
  s/d `...500F (PULVERIZER 7F)`. **`modul` yang dikirim ke `dbCollectData()` sekarang
  dinamis**, pola SAMA PERSIS dengan penamaan file PDF yang sudah ada (`cfDownloadPdf()`):
  - `chk-4000hr` DICENTANG → `'4000 Hr and Feeder Calibration ' + <feeder yang dipilih>`
    (menang TIDAK PEDULI Feeder Calibration/Test Demand Signal ikut dicentang atau tidak —
    di dalam 4000HR sendiri sudah ada tabel Feeder Calibration).
  - `chk-4000hr` TIDAK dicentang → `'Feeder Calibration ' + <feeder yang dipilih>`.
  - Kedua varian SENGAJA sama-sama mengandung substring **"Feeder Calibration"** (persis
    itu, spasi & kapitalisasi sama) — dipakai sebagai kunci `ilike` di adapter trend (lihat
    poin berikutnya) DAN tetap ke-normalize benar oleh `normalizeModul()` di `shared.js`
    (cek `FEEDER`/`COAL`, tidak diubah — string baru ini tetap mengandung `FEEDER`) supaya
    tombol filter "Coal Feeder" di `history.html` dan routing "Buka"/"Revisi" balik ke
    file ini tetap jalan tanpa perlu disentuh.
- **Trend Coal Feeder Calibration di-rombak dari 1 tag agregat jadi 6 tag terpisah**
  (`COAL-FEEDER-A`..`F`, satu per feeder) — konsekuensi langsung dari Feeder No. yang
  sekarang punya daftar tetap:
  - `trend/js/adapters/coal-feeder-calibration-adapter.js`: `modulKey` registrasi diganti
    dari `'Coal Feeder Calibration'` jadi **`'Feeder Calibration'`** (substring yang ADA DI
    SEMUA varian modul di atas, TERMASUK data lama yang masih `'Coal Feeder Calibration'`
    polos — "Feeder Calibration" tetap substring di situ juga, jadi data lama tidak hilang
    dari query, cuma tidak bisa dipetakan ke feeder spesifik — lihat poin berikutnya).
    `extractFeederLetter(s)` menarik huruf A-F dari `r.modul` (utama) atau `r.data.feeder_no`
    (fallback data lama) lewat regex `500([A-F])` / `PULVERIZER 7([A-F])` — baris yang
    huruf feeder-nya TIDAK ketemu di keduanya (mis. data lama free-text sebelum perubahan
    ini) **dilewati** (tidak dipetakan ke feeder mana pun), bukan error.
  - `trend/config/default-tags-coal-feeder-calibration.js`: 6 tag, warna pasangan
    Cal1/Cal2 beda-beda per feeder, series `Demand100FlowRate` pakai `#33505c` (BUKAN warna
    pudar `#5a6b76` — lihat pelajaran kontras teks di bagian atas dokumen ini, jangan
    ulangi lagi di modul baru manapun).
  - `trend/config/modules/coal-feeder-calibration.config.js`: `key`/`adapterKey` ikut jadi
    `'Feeder Calibration'`, `tagIds` jadi array 6 elemen.
  - Hub `index_trend.html`: kartu Coal Feeder Calibration diupdate jadi "6 tag" (dari "1
    tag"), `.hub-stats` total tag naik dari 93 jadi **98**.
  - `?v=` config/adapter file-file di atas dinaikkan ke `20260830c` di
    `trend_coal-feeder-calibration.html`.

## Fix trend Coal Feeder "tidak baca data" — 2 lokasi tabel Cal 1/Cal 2 (2026-08-30)

- Sesudah rollout 6-tag di atas, user tes langsung dan trend-nya kosong ("—") padahal
  sudah ada laporan tersubmit. Dicek `data` mentahnya di Supabase: `data.cal1.deviation`/
  `data.cal2.deviation` MEMANG kosong (`["","",""]`) untuk laporan itu, TAPI datanya
  bukan tidak ada — user konfirmasi "ada di 4000hr tabelnya". Ketemu:
  `cf4kCalTableHtml()` di `coal_feeder_calibration.html` MENANAM ULANG tabel Cal 1/Cal 2
  yang SAMA PERSIS di dalam section "4000 HR PM Pulverizer Instrumentation" (Feeder Floor
  Area) — tapi pakai ID input BEDA (prefix `cf4kcal1_`/`cf4kcal2_`, bukan `cal1_`/`cal2_`)
  supaya tidak bentrok DOM dengan tabel standalone-nya. Kalau teknisi isi tabel itu LEWAT
  section 4000HR (bukan section "Feeder Calibration" standalone), nilainya masuk ke
  **`data.cf4k.floor_feedercal.calValues.cf4kcal1_dev1/2/3`** (dan `cf4kcal2_*`) — LOKASI
  BERBEDA TOTAL dari `data.cal1.deviation` yang tadinya jadi satu-satunya sumber dibaca
  adapter.
  - Fix: `trend/js/adapters/coal-feeder-calibration-adapter.js` sekarang punya
    `cal1DeviationAvg(d)`/`cal2DeviationAvg(d)` yang cek `data.cal1`/`data.cal2` standalone
    DULU, fallback ke `data.cf4k.floor_feedercal.calValues.cf4kcal{1,2}_dev{1,2,3}` kalau
    yang standalone kosong. Diverifikasi langsung pakai data record nyata (Feeder E) —
    sebelum fix: `cal1Avg`/`cal2Avg` = `null`; sesudah fix: `0.0849`/`0.1217`.
  - **Demand Test TIDAK punya versi cf4k-nya** (dicek langsung ke source — cuma
    `cf4kCalTableHtml()` dipanggil 2x untuk Cal 1/Cal 2, tidak ada versi serupa untuk tabel
    demand) — jadi `Demand100FlowRate` tetap 1 sumber saja (`data.demand['100'].fr_act`),
    tidak perlu fallback.
  - `?v=` `coal-feeder-calibration-adapter.js` dinaikkan lagi ke `20260830d`.
  - **Pelajaran buat modul checksheet manapun yang "tabel yang sama dipakai ulang di
    section berbeda"** (pola ini SANGAT mungkin ada di modul lain juga, belum diaudit satu
    per satu) — JANGAN asumsikan 1 field HTML = 1 lokasi penyimpanan `data`. Field yang
    "sama" secara visual/nama kolom bisa punya PREFIX ID BEDA kalau di-reuse di section
    lain, dan karenanya tersimpan di path `data.*` yang beda total. Kalau trend/adapter
    baru "tidak baca data" padahal user yakin datanya ada, WAJIB curigai kemungkinan ini
    duluan — cek `dbCollectData()` sumbernya SECARA LENGKAP (cari semua ID field yang
    mirip/reused), jangan cuma percaya 1 lokasi yang paling jelas kelihatan.

## CEMS Y-max CO Span jadi 800 + Belt Scale dipecah jadi 3 tab trend (2026-08-30)

- `trend/config/default-tags-cems.js`: tag `CEMS-CO-SPAN1` (CO Span1) `engineeringHigh`/
  `max`/`chartMax` diturunkan dari `1000`/`1000`/`1100` jadi **`800`/`800`/`800`** — user
  konfirmasi cuma tag ini yang dimaksud (bukan seluruh 10 tag CEMS, yang rentang alaminya
  jauh beda-beda: SO2/NOx 0-500, CO2 0-20, O2 0-25 — dipaksa 800 semua bakal bikin
  sebagian besar flat/tak terbaca). `?v=` `default-tags-cems.js` naik ke `20260830a`.
- **Ketiga modul Belt Scale (B1-B2, E2-E3, E4-E5) dipecah dari 1 tab (2 tag campur banyak
  series) jadi 3 TAB TERPISAH** ("Error Zero", "Beltscale A Value", "Beltscale B Value") —
  pola SAMA PERSIS dengan FEGT+LD (1 adapter dipakai bersama beberapa `DCS_MODULES` entry,
  tiap entry cuma nunjuk subset `tagIds`-nya sendiri, `module-view.js`'s `getModules()`
  otomatis me-render SATU tab per entry `DCS_MODULES` — generik, TIDAK disentuh). Konsekuensi
  langsung: tiap adapter & default-tags file dipecah dari 2 tag jadi **4 tag sempit**
  (1 tag = 1 series-group per tab, BUKAN 1 tag = 1 titik fisik seperti sebelumnya) supaya
  TAG LIST tiap tab cuma nampilin yang relevan ke tab itu, bukan semua series campur.
  - **E4-E5** (sumber field paling sederhana, cuma 3 series total): tag baru
    `BELTSCALE-E45-{A,B}-ERRORZERO` (series: ErrorZeroCal) & `BELTSCALE-E45-{A,B}-VALUE`
    (series: NewZeroChange, OldZeroChange). Modul `BELT_E45_ERRORZERO`/`_A_VALUE`/`_B_VALUE`.
  - **B1-B2** (11 series/tag sebelumnya): tag baru `BELTB12-{A,B}-ERRORZERO` (series:
    ZeroCalibration [Monthly] + ZeroError [3-Monthly]) & `BELTB12-{A,B}-VALUE` (series:
    SpanError + 8 diagnostik: DiagLoadZero/Span, PulsePass1-3, PulsePerMeter,
    ZeroCheckUnloaded, TestLoadCheck). Modul `BELT_B12_ERRORZERO`/`_A_VALUE`/`_B_VALUE`.
  - **E2-E3** (11 series/tag sebelumnya, penamaan field beda dari B1-B2 walau konsepnya
    sama): tag baru `CCH-SCAL-200{A,B}-ERRORZERO` (series: ZeroError + QuickZeroCheck,
    label "Error Zero Calibration (%)" — ekuivalen `ZeroCalibration` di B1-B2, cuma nama
    field-nya beda) & `CCH-SCAL-200{A,B}-VALUE` (series: SpanError + 8 diagnostik:
    LoadZero/Span, Pass1-3, AvgPulseLength, ZeroCheckUnloaded, TestLoadCheck). Modul
    `BELT_E23_ERRORZERO`/`_A_VALUE`/`_B_VALUE`.
  - ⚠️ **B1-B2/E2-E3 TIDAK PUNYA field "old zero"/"new zero" sama sekali** — sudah dicek
    langsung ke source (`grep -i "old zero\|new zero"` cuma nyantol di `beltscale-e45.html`,
    nihil di 2 file lain) — pemetaan "Error Zero = 2 series zero; A/B Value = sisanya"
    di atas untuk B1-B2/E2-E3 adalah HASIL KONFIRMASI EKSPLISIT user (bukan tebakan),
    karena field aslinya memang beda struktur dari E4-E5 — jangan disamakan lagi ke "old
    zero/new zero" literal kalau nanti direvisi ulang, itu cuma ada di E4-E5.
  - `?v=` config/adapter/tags file di atas dinaikkan ke `20260830b` di ketiga
    `trend_beltscale-*.html`.
  - Hub `index_trend.html`: 3 kartu Belt Scale diupdate jadi "4 tag · 3 tab" (dari "2 tag"),
    deskripsi disesuaikan. `.hub-stats` total tag naik dari 98 jadi **104**
    (net +6: 2→4 tag × 3 modul).

## 🔴 BUG BESAR: data 4 bulan (Mei/Agustus/Oktober/Desember) hilang diam-diam dari SEMUA trend (2026-08-30)

- User lapor trend FEGT berhenti di 29 Juli padahal data Agustus ada, minta diaudit modul
  lain juga. **Ternyata bug SATU FUNGSI yang dipakai SEMUA 14 file adapter** (dikonfirmasi
  `grep -L "recordTimestamp" *.js` di `trend/js/adapters/` — kosong, semua 14 file pakai),
  jadi mempengaruhi SELURUH modul trend, bukan cuma FEGT.
- **Akar masalah**: `recordTimestamp(r)` di `trend/js/supabase-adapter.js` (fungsi TUNGGAL
  tempat semua adapter mengubah `r.tanggal`/`updated_at`/`created_at` jadi angka waktu)
  dulu langsung `new Date(r.tanggal).getTime()`. Field `tanggal` itu string Indonesia "DD
  NamaBulan YYYY" (mis. "27 Agustus 2026") — parser bawaan JS (V8) TERNYATA punya
  heuristik longgar yang cuma KEBETULAN cocok untuk 8 dari 12 nama bulan Indonesia yang
  3-huruf awalnya sama dengan Inggris (Januari→Jan, Maret→Mar, April→Apr, Juni→Jun,
  Juli→Jul, September→Sep, November→Nov, + Februari→Feb) — **TAPI GAGAL TOTAL (Invalid
  Date/NaN) untuk 4 bulan yang prefix-nya BEDA dari Inggris**: **Mei** (May), **Agustus**
  (August), **Oktober** (October), **Desember** (December). Dibuktikan langsung:
  `new Date('15 Agustus 2026')` = Invalid Date, sementara `new Date('15 Juli 2026')` valid.
- **Efek berantai**: `recordTimestamp()` return `null` untuk record apa pun dengan tanggal
  kejadian di 4 bulan itu → `fetchByModulAndRange()` (`if (t === null) return false;`)
  MEMBUANG baris itu SEPENUHNYA dari hasil query → record itu tidak pernah muncul di
  chart, KPI (lastValue/daysSinceLastRecord), deviation panel, ATAU log table di MANA PUN
  — **tanpa error atau warning yang kelihatan sama sekali**, kelihatannya cuma "trend
  berhenti di titik terakhir yang kebetulan masih bulan yang valid" (persis yang dilaporkan
  user: berhenti di 29 Juli, karena laporan Agustus berikutnya semua ke-drop diam-diam).
  Ini SUDAH berlangsung sejak modul trend pertama dibuat (bukan regresi baru) — baru
  ketahuan sekarang karena baru masuk musim bulan-bulan yang kena bug (Agustus 2026).
- **Fix**: `recordTimestamp()` sekarang parse manual format "DD NamaBulan YYYY" pakai peta
  eksplisit nama bulan Indonesia → index bulan (`ID_MONTHS`), BUKAN mengandalkan heuristik
  `Date()` bawaan sama sekali untuk field `tanggal` — baru fallback ke `new Date(raw)`
  polos kalau formatnya BUKAN pola itu (mis. `updated_at`/`created_at` yang memang ISO
  8601, parser bawaan aman dipakai untuk itu). Diverifikasi: ke-12 nama bulan Indonesia
  (termasuk 4 yang tadinya Invalid Date) sekarang semua parse benar, fallback ISO tetap
  jalan normal.
  - `?v=` `supabase-adapter.js` dinaikkan ke `20260830a` di SEMUA 14 halaman
    `trend_*.html` (bukan cuma FEGT — file ini dipakai bersama oleh semua modul).
- **Kalau nambah adapter modul baru di masa depan**: JANGAN PERNAH parse `r.tanggal` (atau
  field tanggal Indonesia manapun) pakai `new Date(string)` polos secara langsung di
  adapter manapun — SELALU lewat `window.SupabaseAdapter.recordTimestamp(r)` yang sudah
  benar.
- Sudah dicek juga `shared.js`/`history.html` (`grep` untuk `new Date(` yang menyentuh
  `.tanggal`) — **TIDAK ditemukan pola serupa di luar `trend/`**. Keduanya sort/tampilkan
  riwayat pakai `updated_at`/`created_at` (ISO 8601 asli dari Supabase, bukan `tanggal`
  string Indonesia) lewat `order=updated_at.desc` di query, jadi tidak kena bug bulan yang
  sama. Bug ini murni terisolasi di sistem trend (`trend/js/supabase-adapter.js`).

## Fix `dbList()` limit=100 (Riwayat tidak menampilkan semua data) + counter per modul (2026-09-01)

- `dbList()` (`shared.js`) sebelumnya ambil `limit=100` untuk SELURUH baris `pm_records`
  (order `updated_at.desc`) SEBELUM difilter per modul di client (`finishWith`) — dengan
  `pm_records` di 145 total baris dan O2 Weekly Inlet+Outlet saja sudah 64 baris (Inlet
  ada yang dari Desember 2024), baris lama ketutup baris modul lain yang lebih baru
  diupdate dan hilang total dari Riwayat walau masih ada di database, TANPA error apa
  pun yang kelihatan. Limit dinaikkan ke 5000 (pada KEDUA varian query — primer dan
  fallback tanpa `firebase_checksheet_id`) — aman karena `select` di query ini cuma ambil
  kolom metadata ringan, tidak pernah menyertakan kolom `data` JSONB yang berat.
- `history.html`: tiap tombol filter modul sekarang menampilkan jumlah laporan
  tersimpan, mis. "O2 Weekly Inlet (34)" — dihitung dari `dbList('', ...)` (yang otomatis
  mengembalikan SEMUA baris tanpa filter) di-group per `normalizeModul()`, lewat
  `pmHistUpdateFilterCounts()`, refresh tiap 20 detik bareng auto-refresh tabel yang
  sudah ada. Setiap tombol filter WAJIB punya atribut `data-modul-filter="<argumen yang
  sama persis dengan onclick="loadHistory('...')"` + `<span class="hist-count">` di dalam
  `<button>` supaya ikut terhitung — **kalau nambah tombol filter modul baru, WAJIB ikuti
  pola ini**, dan div pembungkusnya (`#pmHistFilterBar`) jangan diganti id-nya.

## Overlay "SEDANG MENSUBMIT" untuk tombol Submit MANUAL di semua modul (2026-09-01)

- Beda dari `#pmAutosubmitOverlay` (dokumentasi di atas, `document.write()` SEDINI
  MUNGKIN sebelum DOM ada, khusus halaman `?autosubmit=1`) — overlay baru ini
  (`#pmManualSubmitOverlay`, `pmShowManualSubmitOverlay()`/`pmHideManualSubmitOverlay(ok,
  err)` di `shared.js`) untuk tombol Submit **manual** yang diklik user langsung di
  halaman modul (`raSubmitReport()`, dipakai generik oleh SEMUA modul lewat
  `button[onclick*="raSubmitReport()"]` — 1 titik perubahan di `shared.js` otomatis
  berlaku ke semua file, TIDAK perlu edit tiap file modul satu-satu). Dibuat lewat DOM
  biasa (`createElement`/`appendChild`), BUKAN `document.write()` — beda dari overlay
  autosubmit karena overlay ini muncul SETELAH halaman sudah full-render (di tengah klik
  user), `document.write()` di titik itu akan menghapus seluruh halaman.
- Overlay muncul persis setelah user konfirmasi dialog "Yakin Submit?", dan BARU hilang
  setelah `raSendFinalPdfToFirebaseDashboard()` benar-benar tuntas (bukan cuma status
  Supabase ter-update ke SUBMITTED) — yaitu titik yang sama dengan callback `onDone(ok,
  err)` yang sudah ada. `ok=true` (laporan sungguhan sudah masuk Review Approval
  Dashboard) → overlay ganti jadi pesan sukses lalu hilang sendiri (1.5 detik). `ok=false`
  (gagal/timeout kirim ke Firebase — record TETAP tersimpan SUBMITTED di Supabase, cuma
  belum sync ke Review Approval Dashboard) → overlay **SENGAJA TIDAK hilang otomatis**,
  dikasih tombol "Tutup" manual — supaya user pasti sadar prosesnya belum tuntas
  (`raRetryPendingFirebaseSyncs()` akan coba lagi otomatis di kunjungan berikutnya),
  bukan cuma lewat toast yang gampang kelewat/hilang sendiri.
- z-index sama dengan `#pmAutosubmitOverlay` (`2147483000`, di bawah `#pmAuthGate`
  `2147483647`) — overlay ini otomatis memblok interaksi lain ke halaman selama proses
  berjalan (menutupi seluruh viewport), tidak perlu disable tombol Submit secara terpisah.
- **Kalau ada file modul yang punya jalur submit CUSTOM** (memanggil
  `raSubmitReportCore()` langsung, bukan lewat `raSubmitReport()`) — overlay ini TIDAK
  ikut terpasang di situ. Sudah di-grep saat implementasi: **tidak ada** file modul yang
  melakukan ini per 2026-09-01, semua (termasuk `fegt.html` yang punya 2 tombol Submit
  berbeda) memanggil `raSubmitReport()`. Kalau menambah jalur submit baru di masa depan,
  pastikan tetap lewat `raSubmitReport()` supaya overlay ini otomatis ikut, atau panggil
  `pmShowManualSubmitOverlay()`/`pmHideManualSubmitOverlay()` manual di jalur barunya.

## 🔴 `shared.js`/`shared.css` TIDAK PERNAH punya cache-busting `?v=` (fix 2026-09-02)

- User lapor overlay submit/EIC7 yang baru dipasang (folder terbang, background solid,
  label EIC7) "belum ganti di beberapa browser" walau sudah dipush ke GitHub. Root cause:
  `shared.js`/`shared.css` dimuat di **31/21 file** (`<script src="shared.js">`,
  `<link href="shared.css">`) **TANPA query param `?v=` sama sekali** — beda dari
  `trend/*.html` yang SUDAH lama pakai konvensi ini (lihat komentar "?v= cache-busting"
  di `trend_*.html`). Browser (terutama Chrome mobile, sudah pernah jadi masalah yang sama
  di sistem trend) bisa nyimpan cache file itu lama sekali karena URL-nya tidak pernah
  berubah — device yang kebetulan sudah cache `shared.js` versi LAMA (sebelum overlay
  folder terbang dipasang) terus menampilkan versi lama tanpa error apa pun yang
  kelihatan, walau repo GitHub sudah benar ter-update.
- **Fix**: semua referensi `shared.js`/`shared.css` di 31 file (termasuk `outage-*.html`
  — sistem Outage TERNYATA tetap memuat `shared.js`, walau CSS-nya sendiri terpisah)
  sekarang pakai `?v=20260902a`.
- **WAJIB naikkan angka versi ini lagi setiap kali `shared.js` ATAU `shared.css` diubah**
  ke depannya — sama seperti konvensi `?v=` yang sudah lama dipakai di `trend/*.html`.
  Lupa naikkan versi = perubahan baru bisa "tidak kelihatan" di sebagian device untuk
  waktu yang tidak terduga (tergantung kapan cache browser device itu terakhir expire),
  persis kasus yang baru terjadi ini.
- **Belum diperluas** ke `db-helper.js`/`storage-helper.js`/`approval-helper.js`/
  `firebase-config.js` (juga dimuat di 20 file TANPA `?v=` sama sekali) — file-file itu
  jarang berubah (vendored dari upstream, lihat catatan "vendored copy yang basi" di atas)
  jadi risikonya lebih kecil, tapi kalau ke depan ada fix mendesak di salah satu file itu
  dan user lapor "belum kelihatan di beberapa device" lagi, curigai hal yang sama dan
  tambahkan `?v=` ke situ juga.

## Modul baru: ID Fan Flow Transmitter Line Purging (MOD-21, 2026-09-02)

- Didigitalisasi dari CSV checksheet kertas "ID FAN Flow Transmitters Impulse Line
  Purging" untuk `7BG-FAN-500` (Induced Draft Fan 7), tracking dua flow transmitter
  `7BG-FT-933A`/`7BG-FT-933B` sekaligus dalam SATU form (bukan 2 form terpisah) --
  CSV sumbernya sendiri agak berantakan (hasil export Excel/PDF yang kolomnya
  ke-split aneh), jadi struktur tabel di-rekonstruksi manual + dikonfirmasi ke user
  sebelum dibangun (lihat riwayat percakapan kalau perlu detail alasannya):
  - Tiap baris checklist (langkah 1,2,3,4,5,6,8,9,10 -- TIDAK ADA baris "7" di tabel
    checklist, langkah 7 adalah tabel pengukuran terpisah) punya **4 checkbox**
    (Pass A/Fail A/Pass B/Fail B) -- status 933A dan 933B dicatat TERPISAH, bukan
    status tunggal untuk keduanya, walau sebagian baris di CSV keliatan cuma
    menampilkan 1 "OK" (kemungkinan artifact export yang hilang, bukan disengaja).
  - Langkah 9 ("Raise new WO & repair if any defect found") SENGAJA pakai widget
    Pass/Fail generik yang SAMA dengan baris lain (bukan widget Ya/Tidak khusus)
    walau makna "Pass" di baris ini = "tidak ada defect" (kebalikan makna literal
    tapi konsisten UI-nya) -- keputusan sadar, jangan diubah jadi widget beda kalau
    direvisi ulang.
  - Langkah 7 jadi tabel pengukuran terpisah "Card Value (mA)" + "Flow (T/H)", MASING-
    MASING 4 kolom numerik (Before 933A/After 933A/Before 933B/After 933B) -- kosong
    by default (bukan pre-fill contoh angka dari CSV).
  - 2 galeri foto evidence terpisah (bukan 1 galeri gabungan) -- "Cleaning Panel"
    (langkah 4) dan "Before/After Line Purging" (langkah 7). Implementasi PAKAI 1
    registry `EV_GALLERIES = {cleaning:{...}, purging:{...}}` + fungsi generik
    yang menerima parameter `gk` ('cleaning'/'purging'), BUKAN 2 salinan fungsi
    duplikat -- kalau nambah galeri evidence ke-3 di modul ini nanti, tambahkan
    entry baru ke registry itu, jangan copy-paste fungsi lagi.
- Area (`RA_MODUL_AREA`): **`boiler`** -- ID Fan menarik flue gas dari furnace, satu
  bucket dengan FEGT/SO2/CEMS/Opacity/Flow Meter FGD (semua instrumen jalur flue gas
  boiler), BUKAN `common`/`turbine` walau nama "Fan" terdengar seperti equipment
  mekanikal umum.
- `window.CURRENT_MODUL = 'ID_FAN_LINE_PURGING'` (nilai yang BENAR-BENAR tersimpan ke
  `pm_records.modul`), beda dari argumen `dbSave('id_fan_line_purging')` (lowercase,
  cuma dipakai `dbCollectData(modul)` buat validasi pemanggil) -- pola identik dengan
  `generator_stator_leak_monitoring.html`, JANGAN disamakan jadi satu string.
- File ini dibangun oleh subagent (general-purpose, bukan fork) yang 2x gagal dengan
  server error ("response stopped arriving") persis di titik mau menulis file HTML
  besar (~2000 baris) sekaligus dalam 1 tool call -- baru berhasil setelah diminta
  menulis BERTAHAP (skeleton dulu via Write, lalu isi tiap bagian lewat Edit
  terpisah-terpisah). **Pelajaran untuk task serupa di masa depan** (bikin file HTML
  modul baru yang besar dari nol): kalau delegasi ke subagent, minta dari awal untuk
  menulis bertahap (Write skeleton kecil + banyak Edit kecil), jangan minta tulis
  1 file besar sekaligus dalam 1 Write -- lebih tahan terhadap error server di
  tengah generasi panjang, dan lebih gampang diverifikasi bertahap juga.

## Pisah DCS Console Common CHCB/WWTP dari dcs-hmi-inspection.html (2026-09-02)

- `dcs-hmi-inspection.html` dulu punya 9 kolom drop/console dalam `DCS_DROPS`:
  6 milik Unit 7 MCR asli (`drop200`-`drop214`) + 3 kolom **placeholder generik**
  (`ceccons`/`cecch1`/`cecch2`, label "CEC-CONS-WW"/"CEC-CONS-CH1"/"CEC-CONS-CH2")
  yang sebenarnya BUKAN bagian Unit 7 MCR — tag & deskripsi aslinya baru dikonfirmasi
  user dari sistem lain (Maximo-style asset lookup, screenshot). 3 kolom itu
  DIHAPUS dari `DCS_DROPS` di file ini dan dipindah ke 2 modul baru:
  - `dcs-console-chcb.html` (MOD-22, area `common`) — 5 tag asli:
    `CEC-DROP-212`, `CEC-DROP-213`, `CEC-DROP-CH0`, `CEC-DROP-CH1`, `CEC-DROP-CH2`.
  - `dcs-console-wwtp.html` (MOD-23, area `wwtp`) — 2 tag asli:
    `CEC-DROP-WWT1`, `CEC-DROP-WWT2`.
  - **Alasan dipecah jadi 2 file, bukan 1 file gabungan 7 kolom** (dikonfirmasi ke
    user): satu modul di arsitektur ini cuma bisa punya SATU nilai `RA_MODUL_AREA`
    (satu laporan = satu reviewer/area tujuan di Review Approval Dashboard) — CHCB
    dan WWTP butuh 2 reviewer/area beda, jadi HARUS 2 modul terpisah supaya routing
    otomatisnya benar.
  - Kedua file baru adalah **copy langsung** dari `dcs-hmi-inspection.html`
    (struktur checklist 13 langkah "Step of Work" SAMA PERSIS, cuma `DCS_DROPS`
    + judul/topbar + 4 titik registrasi modul yang beda: argumen `dbSave()`,
    check `modul !==` di `dbCollectData()`, `window.CURRENT_MODUL`, dan literal
    `modul:` yang dikembalikan) — bukan dibangun dari nol, supaya semua fitur
    reusable (crop modal, autosave, PDF, dst.) ikut otomatis tanpa perlu ditulis
    ulang. **Kalau modul ini perlu direvisi lagi ke depan, cek KETIGA file**
    (`dcs-hmi-inspection.html`, `dcs-console-chcb.html`, `dcs-console-wwtp.html`)
    kalau perubahannya menyangkut struktur checklist/PDF yang dulunya sama-sama
    di-copy dari sumber yang sama — gampang lupa salah satu kalau cuma edit 1 file.
- Label & deskripsi `drop210`-`drop213` (Unit 7 MCR) DIPERBAIKI dari placeholder
  generik "Drop 21X"/"OPT/OPC Operator Workstation" jadi tag asli
  `7EC-DROP-210`...`213` / "U#7 MCR Operator Work Station 21X" (dikonfirmasi dari
  screenshot yang sama). `drop214` jadi tag `CEC-CONS-CR1` / "#C MCR Operator
  Interface Station Drop Unit 7 214". **`id` INTERNAL field-field ini (`drop210`,
  dst.) SENGAJA TIDAK diubah** (tetap `drop210`...`drop214`) walau tag tampilannya
  berubah total — supaya data historis yang sudah tersimpan (key `dcsActiveDrops`/
  `data.checks[idx].drops` pakai id lama) tetap kebaca normal setelah label
  berubah. Sudah diverifikasi: 1 record historis existing DCS-HMI tetap kebuka
  tanpa error setelah perubahan ini.
- `normalizeModul()` (shared.js): kedua modul baru (`CEC_CONSOLE_CHCB`/
  `CEC_CONSOLE_WWTP`) dicek `n.indexOf('CHCB')`/`n.indexOf('WWTP'/'WWT')` +
  `n.indexOf('CONSOLE')` **SEBELUM** cek generik `DCS`/`HMI`/`OIS` di baris
  berikutnya — modul string barunya ("Inspection & Cleaning DCS Console - Common
  CHCB/WWTP") mengandung substring "DCS" juga, jadi kalau urutan dibalik bakal
  ke-normalize salah jadi `DCS_HMI` (kebuka lewat `dcs-hmi-inspection.html`, file
  salah — pola proteksi yang sama seperti `GENERATOR_STATOR_LEAK` vs `FEGT/LEAK`).

## 🔴🔴 BUG KRITIS: `_pmStripBase64ForSave()` memutasi state foto LIVE di SEMUA modul (2026-09-02)

- User lapor di `cems_calibration.html`: foto yang di-crop-ulang tampil **hitam** di
  crop modal, dan foto **hilang** (kotak kosong) di PDF preview maupun PDF final —
  padahal thumbnail di galeri masih kelihatan normal. Investigasi awal fokus ke file
  itu saja, tapi root cause-nya ternyata di **`shared.js`, dipakai SEMUA modul**.
- **Root cause**: `_pmStripBase64ForSave(obj)` (dipanggil `dbSave()`, `dbSaveSilent()`
  /autosave, DAN `raResaveInPlace()` — 3 jalur simpan) versi lama **memutasi `obj`
  in-place** (`obj.dataUrl = ''`). Semua `dbCollectData()`/`collectData()` tiap modul
  mengembalikan array/object evidence **LANGSUNG** (mis. `evidence: calEvidence` —
  REFERENCE yang sama, bukan clone) sebagai bagian dari `rec.data`. Jadi
  `_pmStripBase64ForSave(rec.data)` sebenarnya memutasi **`calEvidence` yang sama
  persis** dengan yang masih dipakai UI halaman itu.
- **Efek berantai**: begitu SATU KALI saja proses simpan (manual, submit, ATAU
  autosave otomatis di background) jalan untuk foto yang sudah punya `driveUrl`,
  `entry.dataUrl`-nya langsung KOSONG **di memori live juga** — bukan cuma di
  payload yang dikirim ke Supabase (yang MEMANG sengaja dikosongkan, itu bukan
  bug). Efeknya BEDA-BEDA tergantung siapa yang baca `dataUrl` setelah itu, TANPA
  reload halaman sama sekali:
  - Thumbnail galeri (`<img src="...">` yang SUDAH ter-render sebelumnya) tetap
    kelihatan normal — browser tidak re-fetch src yang sama, jadi DOM lama masih
    nempel. **Ini yang bikin bug ini gampang lolos ke luput** — kelihatannya foto
    baik-baik saja di galeri.
  - Klik "✂️ Crop Ulang" → `img.src = ''` (dataUrl kosong) → crop modal nampil
    **hitam polos** (background `#cropWrap` default, gambar tidak pernah ter-load).
  - Generate PDF → `doc.addImage('', ...)` gagal → **`try{}catch(e){}` diam-diam
    menelan error-nya** (pola lama di semua fungsi `drawEvidenceGroup`-sejenis) →
    kotak foto kosong bergaris tepi, tanpa error/warning yang kelihatan sama sekali.
  - Autosave berjalan periodik di background (lihat dokumentasi autosave di atas)
    — jadi bug ini **akan** ke-trigger cepat atau lambat di HAMPIR SEMUA sesi kerja
    yang cukup panjang untuk sempat autosave sekali, ditambah upload foto sebelum
    ATAU sesudah momen autosave itu.
- **Fix**: `_pmStripBase64ForSave()` sekarang **mengembalikan deep-clone** yang
  sudah di-strip, **TIDAK PERNAH memutasi `obj` aslinya**. Ketiga titik pemanggil
  diubah dari `_pmStripBase64ForSave(rec.data);` (pola LAMA, sekarang jadi no-op
  efektif kalau ditulis ulang seperti ini) jadi
  `rec.data = _pmStripBase64ForSave(rec.data);` (assign hasil return-nya) — WAJIB
  pola ini kalau ada jalur simpan baru yang butuh strip base64 juga di masa depan.
- **Dampaknya BUKAN cuma CEMS Calibration** — fungsi ini dipakai generik oleh
  `dbSave()`/`dbSaveSilent()`/`raResaveInPlace()` untuk SEMUA modul yang punya foto
  evidence. Kalau ke depan ada laporan serupa ("foto hilang di crop-ulang/PDF,
  padahal thumbnail masih ada") dari modul LAIN, ini sudah otomatis ikut
  terselesaikan oleh fix yang sama — TIDAK perlu diperbaiki lagi per file.
- **Cara verifikasi cepat kalau curiga regresi serupa di masa depan**: di console
  browser pada modul mana pun yang lagi dibuka, jalankan
  `_pmStripBase64ForSave({dataUrl:'data:x',driveUrl:'y'})` lalu cek nilai
  return-nya `.dataUrl === ''` (benar) TAPI objek argumen asli yang dipegang
  variabel terpisah TIDAK ikut berubah — kalau argumen aslinya ikut berubah,
  berarti ada pemanggilan baru yang balik memutasi in-place lagi.

## Revisi CEMS Calibration (2026-09-02): urutan DAS + ABS Error/Drift Limit

- `DAS_FIELDS` ("Analyzer Reading (DAS) Before/After Calibration", Step 4 & 7)
  urutannya diubah sesuai screenshot layar DAS sungguhan: Flow-SO2-NOx-CO2 (baris
  1), O2-Hg-PM-Pressure (baris 2) — urutan array = urutan render `.field-grid`
  (CSS grid auto-flow, lihat `buildDasGrid()`). Field **"Gas Stack Reading"**
  DIPINDAH dari `TEMP_FIELDS` ke `DAS_FIELDS` (baris ke-3, sendirian) dan diganti
  nama jadi **"Gas Stack Temp Reading"**. Karena field ini pindah ARRAY (dari
  `temperature.GasStack` jadi `dasBefore.GasStack`/`dasAfter.GasStack`), record
  historis lama yang sudah punya nilai di situ TIDAK hilang dari database, cuma
  tidak lagi muncul di form manapun (baik TEMP grid maupun DAS grid) — dampak
  collateral yang disengaja/diterima dari restrukturisasi ini, bukan bug.
- Tabel kalibrasi Zero/Span1/Span2 (Step 5, fungsi `buildCalTable()`/PDF
  `calTable()`) dapat 2 kolom baru:
  - **ABS Error** = `|Expected Value - Concentration|`, **SELALU dihitung ulang**
    (live lewat `updateAbsError()` saat input exp/act berubah, di PDF lewat
    `Math.abs(parseFloat(exp)-parseFloat(act))`) — **TIDAK PERNAH disimpan** ke
    `pm_records.data` sebagai field terpisah, supaya tidak ada 2 sumber
    kebenaran yang bisa saling tidak sinkron. Kalau nanti butuh field ABS Error
    di tabel lain, ikuti pola ini (turunan, bukan field tersimpan).
  - **Drift Limit** — kolom kosong murni (input manual, TIDAK ada default/
    perhitungan apa pun), disimpan sebagai `data.zero/span1/span2.<key>.drift`.
    Sengaja kosong sesuai permintaan user ("sediakan tabelnya saja").

## `maintenance_report_form.html`: nama laporan dinamis "WO_Asset_AssetDesc" + Area (2026-09-02)

- **Migration WAJIB dijalankan dulu** sebelum file ini dipakai lagi setelah
  update ini: `ALTER TABLE pm_records ADD COLUMN IF NOT EXISTS asset text,
  ADD COLUMN IF NOT EXISTS asset_desc text, ADD COLUMN IF NOT EXISTS area
  text;` + `NOTIFY pgrst, 'reload schema';` — ketiganya NULLABLE murni
  (tidak ada default/NOT NULL), tidak menyentuh kolom/tabel lain. Kalau lupa
  dijalankan: `dbSave()`/`dbSaveSilent()` di file ini akan GAGAL TOTAL (PostgREST
  menolak SELURUH POST/PATCH kalau ada 1 saja key yang bukan kolom asli
  tabelnya, bukan cuma mengabaikan field itu) — sama seperti pola
  `firebase_checksheet_id` yang sudah ada sebelumnya.
- **Kenapa 3 kolom BARU (bukan cuma pakai `data` JSONB yang sudah ada)**:
  `dbList()` (Riwayat) sengaja TIDAK PERNAH fetch kolom `data` (berat, JSONB)
  supaya daftar Riwayat tetap ringan/cepat — cuma kolom metadata tipis
  (`BASE_COLS`) yang di-select. Karena `assetTag`/`assetDesc` sebelumnya cuma
  ada di dalam `data`, Riwayat tidak bisa menampilkan nama laporan yang
  membedakan satu Maintenance Report dari yang lain (semua tampil generik
  "Maintenance Report"). 3 kolom ringan baru (`asset`, `asset_desc`, `area`)
  di top-level row menyelesaikan ini tanpa perlu fetch `data` sama sekali.
  Nilainya TETAP disimpan dobel di dalam `data.assetTag`/`data.assetDesc` juga
  (tidak dihapus) untuk kompatibilitas record lama/PDF export yang masih baca
  dari situ.
- `dbList()` (`shared.js`) — `AREA_COLS = 'asset,asset_desc,area'` ditambah ke
  select, dengan fallback BERTINGKAT (3 level: base+firebase_checksheet_id+
  AREA_COLS → base+firebase_checksheet_id saja → base saja) persis pola
  `firebase_checksheet_id` yang sudah ada — supaya Riwayat tidak ikut rusak
  total kalau migration di atas belum sempat dijalankan.
- **`record.modul` TETAP `'Maintenance Report'` (TIDAK diubah jadi dinamis)**
  — ini SENGAJA, bukan lupa. `modul` adalah kunci ROUTING (`normalizeModul()`/
  `modulToUrl()`/filter tombol Riwayat) yang harus 100% stabil; Maintenance
  Report dipakai untuk equipment APA SAJA lintas plant (bukan 1 equipment
  tetap seperti modul lain), jadi asset/asset description-nya berupa teks
  bebas yang BISA kebetulan mengandung kata kunci modul lain (mis. "O2
  Analyzer", "SO2", "FEGT") — kalau ikut ditaruh di `modul`, `normalizeModul()`
  bisa salah rute buka file modul lain. Nama dinamis "WO_Asset_AssetDesc"
  HANYA dipakai sebagai **label tampilan** (Riwayat, lewat `historyReportName()`
  di `history.html`) dan **nama laporan yang dikirim ke Review Approval
  Dashboard** (`assetName`, lewat `record.asset`/`record.asset_desc` di
  `raSendFinalPdfToFirebaseDashboard()`, `shared.js`) — bukan pengganti kunci
  routing. Pola ini GENERIK: modul lain di masa depan yang juga ingin nama
  dinamis serupa tinggal ikut mengisi kolom `asset`/`asset_desc` yang sama,
  tidak perlu ubah `raSendFinalPdfToFirebaseDashboard()`/`historyReportName()`
  lagi — modul yang tidak mengisi kolom ini (semua 19 modul lain saat ini)
  otomatis tetap pakai label statis lama, tidak ada regresi.
- **Dropdown Area baru** (`#area` di "Informasi Pekerjaan": Boiler/Turbine/
  Common CHCB/Common WWTP, value `boiler`/`turbine`/`common`/`wwtp` — PERSIS
  sama dengan kosakata `RA_MODUL_AREA`/`RA_AREA_LABEL_C7` yang sudah ada,
  supaya tidak nyimpang) diisi USER PER LAPORAN (bukan tetap per-modul seperti
  modul lain) karena Maintenance Report tidak terikat 1 area tetap. Disimpan
  ke kolom ringan `area` yang sama. `raSendFinalPdfToFirebaseDashboard()`
  sekarang `var areaKey = record.area || RA_MODUL_AREA[modKey];` (prioritaskan
  `record.area` per-laporan di atas peta statis) — ini yang benar-benar
  menentukan `team`/`area` dikirim ke `Approvals.submitWithFiles()` untuk
  routing reviewer/filter area di Review Approval Dashboard.
  `historyAreaLabel()` (`history.html`) juga diupdate senada: sekarang terima
  row PENUH (bukan cuma string modul) dan prioritaskan `r.area`.
- Fix tambahan yang ditemukan waktu audit file ini terhadap dokumen di atas:
  budget kompresi foto jalur `cropAndSave()` (`var MAX`) di file ini MASIH
  1MB (`1*1024*1024`) — bukan 500KB seperti seharusnya (lihat bagian "Budget
  kompresi foto (500KB) TIDAK terpusat" di atas, ternyata file ini kelewat
  saat perbaikan 20 file sebelumnya). Sudah disamakan ke `500*1024`.
- Format submit laporan LAMA (sistem login bertingkat/checker/reviewer, pilot
  awal fitur approval PM) **sudah tidak ada** di file ini per audit ini —
  sudah diganti generic `raSubmitReport()`/`raSubmitReportCore()` (`shared.js`)
  sejak commit sebelumnya, cuma sisa komentar "checker/reviewer/login dihapus"
  yang menjelaskan histori ini. Tidak ada perubahan kode diperlukan di bagian
  ini.
- Card baru **"Form Report Sementara"** ditambahkan di `index.html` (setelah
  card MOD-09), link LANGSUNG ke `maintenance_report_form.html` lokal — beda
  dari card **MOD-09 "Maintenance Report Form"** yang SUDAH ADA SEBELUMNYA,
  yang ternyata linknya ke halaman EKSTERNAL
  (`eenputra.github.io/CHECK-SHEET-POMI-ELEKTRIK-ONLINE/UNIT%208/...`, repo
  Unit 8 milik pihak lain) — BUKAN ke file lokal ini. Ditemukan waktu audit
  ini, TIDAK diubah/dihapus (di luar scope yang diminta), tapi perlu diketahui
  kalau nanti ada laporan serupa "MOD-09 kebuka ke tempat yang salah".

## Modul baru: JSA Report (`jsa_report.html`, 2026-09-03) — generate Word dinamis

- **Beda TOTAL dari semua modul lain di repo ini**: outputnya **Word (.docx)**,
  BUKAN PDF, dan **TIDAK ADA** alur Submit/Review Approval Dashboard sama
  sekali (dikonfirmasi eksplisit oleh user — tujuannya file Word ini
  direview & ditandatangani manual oleh pihak terkait, bukan lewat dashboard
  approval online). Cuma ada 2 aksi: **Simpan Draft** (`dbSave('JSA Report')`,
  ke Supabase `pm_records` seperti modul lain, supaya tidak hilang & muncul
  di Riwayat) dan **Generate Word** (proses 100% di browser, TIDAK ada
  server/Python di baliknya).
- **Template acuan**: `jsa_template.docx` (root repo, binary asset) — ini
  adalah salinan PERSIS `JSA_BUILD_DISMANTLE_SCAFFOLDING_FINAL_CONTOH_BERSIH.docx`
  yang sudah dikonfirmasi user sebagai template resmi (5 tabel: judul, info+
  risk-assessment matrix, tabel JSA 5 kolom, spacer, tabel Gas Test PEL —
  lihat riwayat percakapan sebelumnya soal cara tabel ini ditemukan/disanitasi
  dari 2 tanda tangan asli). **Kalau template resminya berubah lagi di masa
  depan** (revisi form baru dari user), file `jsa_template.docx` ini yang
  perlu diganti — tapi HARUS diaudit ulang struktur XML-nya dulu (lihat poin
  di bawah, banyak field bergantung index baris/sel PERSIS) sebelum
  `jsaFillTable1()`/`jsaRebuildTable2()` dianggap masih valid.
- **Mesin generate Word** (`jsaGenerateWord()` di `jsa_report.html`) pakai
  **JSZip** (CDN, MIT license — bukan library docx-template berbayar seperti
  docxtemplater, supaya konsisten dengan semua dependency lain di repo ini
  yang gratis) + `DOMParser`/`XMLSerializer` BAWAAN BROWSER buat baca/tulis
  `word/document.xml` di dalam file .docx (yang sebenarnya cuma ZIP berisi
  XML). Alurnya: `fetch('jsa_template.docx')` → `JSZip.loadAsync()` → parse
  `word/document.xml` → `jsaFillTable1()` (isi field Informasi Pekerjaan) +
  `jsaRebuildTable2()` (buang isi contoh lama, bangun ulang dari step/hazard
  yang diisi user) → `XMLSerializer` → `zip.generateAsync({type:'blob'})` →
  download lewat `<a download>` sementara (`jsaDownloadBlob`).
- **⚠️ SELALU akses paragraf/run lewat DIRECT-CHILD saja**
  (`jsaDirectChildren(el, localName)`, filter manual `childNodes` by
  `namespaceURI`+`localName` — BUKAN `querySelector`/`getElementsByTagName`
  yang tembus ke descendant manapun) — pelajaran yang sama persis dari
  pembuatan contoh sample Python (lxml) sebelumnya: kalau ada drawing/textbox
  bersarang dengan paragraf sendiri, traversal yang tidak direct-child-aware
  bisa salah pilih node. Semua helper (`jsaSetParagraphText`,
  `jsaSetSoleCheckboxText`, dst.) mengikuti aturan ini.
- **Struktur Table 1 (info-header) PENUH KEJUTAN kalau tidak dicek XML
  mentahnya** — jangan asumsi dari tampilan visual/python-docx text dump
  saja. Yang paling penting: **Row 0 (Equipment Tag) ternyata 2 PARAGRAF
  TERPISAH** (`p[0]`="Area to be Access...(KKS No.): " label, `p[1]`=nilai
  tag) — BUKAN 1 paragraf gabungan seperti kelihatannya dari python-docx
  `cell.text` (yang menggabungkan semua paragraf jadi satu string tanpa
  pemisah jelas). Riset awal sempat salah asumsi ini 1 paragraf, ketahuan
  lewat selftest otomatis (lihat poin di bawah) yang mendeteksi teks contoh
  lama "7TL-MOV-250" masih nyangkut setelah generate. **Kalau field baru mau
  ditambahkan ke Table 1 di masa depan, WAJIB verifikasi ulang jumlah
  paragraf per sel pakai lxml (`tc.findall("w:p", NS)`) SATU PER SATU**,
  jangan percaya hasil `cell.text` python-docx atau tampilan visual Word.
  Sel lain yang sudah diverifikasi (row2 HIRA, row8/9 checkbox Risk Category,
  row20 WO/Priority/EPAS, row21 tanggal, row23 nama signature) semuanya
  memang cuma 1 paragraf, aman.
- **Table 2 (JOB SAFETY ANALYSIS) jauh lebih sederhana** dari pola
  `JSA_Standard.docx` yang lama (numId/bullet, border double/dotted beda per
  posisi baris) — template BARU ini tidak pakai numId sama sekali (section
  letter "A."/"B."/"C." literal teks biasa), dan border SERAGAM di semua
  baris (top/bottom selalu dotted, kecuali No./Work Sequence kolom yang
  punya `left=single`/`right=double` tetap) — tidak ada perlakuan khusus
  baris pertama/terakhir. `jsaSectionHeaderRow()`/`jsaHazardTableRow()` di
  `jsa_report.html` meniru pola ini persis (constants `JSA_COLW`, border
  spec hardcoded sesuai hasil baca XML mentah — lihat riwayat percakapan
  kalau perlu detail lengkap tiap kombinasi border).
- **No. (nomor step) di-reset per SECTION** (bukan nomor urut keseluruhan
  tabel) — step pertama tiap section A/B/C selalu mulai dari 1 lagi.
  Section yang usernya TIDAK isi step sama sekali (`jsaState.sections[code]
  .steps.length === 0`) **dilewati total** (header section-nya juga tidak
  dicetak) — supaya tidak ada "B. Work Process" kosong tanpa isi di output.
- **Hazard picker**: library gabungan disimpan di `jsa_hazard_bank.json`
  (root repo, 29 entry) — hasil MERGE `hazard_bank.json` (dikirim user lebih
  awal, isi hazard utk contoh job ganti bearing pompa, 22 hazard unik setelah
  di-dedupe lintas section A/B/C) **+ 7 hazard baru** yang diekstrak dari
  `JSA_BUILD_DISMANTLE_SCAFFOLDING_FINAL_CONTOH_BERSIH.docx` (contoh job
  scaffolding real) yang belum ada di `hazard_bank.json` (permukaan panas,
  beban scaffolding lebihi kapasitas, benda jatuh dari ketinggian, scaffolding
  tanpa tag/SWL, dst — lihat field `source` tiap entry utk asal-usulnya).
  **Ini KHUSUS diminta user** ("cek juga hazard dari dokumen sebelumnya...
  tambahkan yang tidak ada"). Format tiap entry: `{id, hazard:[...],
  risk:[...], control:[...], source?}` — `hazard`/`risk`/`control` array
  (multi-kalimat), `jsaHazardBank` di JS gabungkan jadi string `' / '`
  (hazard) atau `'\n'` (risk/control, 1 baris = 1 paragraf nanti). **Kalau
  user kirim daftar hazard "final" di masa depan** (sempat dijanjikan "saya
  kirim nanti" di awal percakapan) — replace isi `jsa_hazard_bank.json`
  dengan format yang sama, TIDAK perlu ubah kode `jsa_report.html` sama
  sekali (picker generik baca apa adanya dari file JSON ini).
- **🔴 CAKUPAN SENGAJA BERTAHAP (persetujuan eksplisit user)** — field yang
  SUDAH dinamis: Equipment Tag, Work to be Done, Work Method (multi-baris),
  HIRA reference, Risk Category (LOW/HIGH toggle), WO/Priority/EPAS App,
  Work Period Start/Finish, 5 nama Signature (Applicant/Operation Supervisor/
  Health & Safety/RIC/Maintenance Supervisor — teks nama saja, TIDAK ada
  capture tanda tangan gambar, konsisten dengan semua modul lain di repo
  ini), dan tentu saja Section/Step/Hazard (fitur inti). **BELUM dinamis**
  (sengaja dideferred ke versi berikutnya): matrix checklist Risk
  Category detail (Lifting Plan/Confined Space/Excavation/Hot Work/Working
  at High/Online-Offline Voltage) + PLANT PROCESS HAZARD IDENTIFICATION
  (~30 checkbox Online/Offline/Oxygen/Flammable), tabel Gas Test PEL, tabel
  CONTROL MEASURES SELECTION, section "Additional Control Measures" & 
  "Warning and Instruction to RIC" — semua bagian ini **MASIH MEMBAWA ISIAN
  ASLI dari contoh job scaffolding** (mis. "VARIABLE OPEN BREAKER AND
  VARIABLE GROUNDING" di Additional Control Measures, checkbox
  "Isolate Electrical Power supply"/dll ter-centang) karena `jsa_report.html`
  TIDAK menyentuh Table 1 baris-baris itu maupun Table 3/4 sama sekali.
  **User HARUS diberi tahu jelas** tiap kali modul ini dipakai/didemokan:
  bagian-bagian itu perlu diedit MANUAL di Word setelah di-generate kalau
  tidak relevan dengan pekerjaan yang baru. Kalau nanti diminta melanjutkan
  ke fase berikutnya, cek riwayat percakapan bagian "Cakupan checklist" utk
  keputusan bertahap ini.
- **Diverifikasi lewat selftest otomatis** (browser asli, headless Chrome +
  local HTTP server sementara — BUKAN cuma baca kode): isi semua field +
  2 step section A + 1 step section B + campuran hazard dari library &
  manual, generate, lalu re-parse hasil akhirnya dan cek isi tiap field
  benar DAN teks contoh lama (`7TL-MOV-250`) sudah tidak ada sama sekali.
  Kode selftest ini SUDAH DIHAPUS lagi dari `jsa_report.html` (cuma dipakai
  sekali waktu development, bukan bagian permanen file). Hasil akhirnya juga
  dikonversi ke PDF lewat LibreOffice headless **HANYA untuk verifikasi
  visual internal** (border tabel, layout, tidak ada korupsi) — TIDAK
  pernah dikirim ke user sebagai deliverable (user eksplisit minta Word
  saja, bukan PDF).
- Registrasi generik: `normalizeModul()` (`shared.js`) — cek substring
  `'JSA'` **SEBELUM** cek `MAINTENANCE`/`REPORT` (modul ini bernilai literal
  `'JSA Report'`, yang mengandung substring `'REPORT'` juga — pola proteksi
  sama seperti `GENERATOR_STATOR_LEAK` vs `FEGT`). `raModulToUrl()` diarahkan
  ke `jsa_report.html?id=`. Tombol filter "JSA" ditambahkan di
  `history.html`, card baru ditambahkan di `index.html`.

## JSA Report v2: ganti template ke "FORMAT JSA BARU.docx" + checklist lengkap (2026-09-03)

- **Template diganti TOTAL** — user kirim `JSA/FORMAT JSA BARU.docx` (taruh
  langsung di folder repo, bukan lewat upload chat) sebagai pengganti resmi
  `jsa_template.docx` v1 (`JSA_BUILD_DISMANTLE_SCAFFOLDING_FINAL_CONTOH_BERSIH.docx`).
  Struktur formulirnya BEDA CUKUP JAUH dari v1 — footer/referensi PI berubah
  dari `PI-05-02-07-F01` ke `PI-05-03-01-F01`, Table 1 (info-header) naik
  dari 25 jadi 28 baris, Table 2 (JSA) kehilangan kolom "No." terpisah.
  **Ditemukan & disanitasi 2 tanda tangan asli lagi** sebelum dipakai
  (standar privasi yang sama seperti template-template sebelumnya): scan
  tanda tangan "Fajar ds." (dipakai 2x, `rId9`→`media/image2.png`) dan 1
  scan tanpa nama di sebelah nama asli "Kurniawan" (RIC, `rId10`→
  `media/image3.png`) — keduanya dihapus total dari file (bukan cuma
  disembunyikan), lihat `sanitize_new_jsa_template.py` di riwayat kerja kalau
  perlu reproduce untuk template berikutnya. `image4.png` (diagram logic
  alarm furnace, konten teknis job asli, BUKAN data pribadi) sengaja
  dibiarkan — toh ada di dalam Table 2 yang selalu dibongkar ulang oleh
  `jsaRebuildTable2()`, jadi otomatis tidak pernah ikut ke output mana pun.
- **🔴 Pelajaran penting (lagi) soal riset struktur XML sebelum coding**:
  riset awal mengira checkbox Risk Level (Low/Medium/High/Extreme, row 2
  tc1-4) TIDAK BISA ditoggle otomatis karena tc High/Extreme kelihatannya
  "tidak punya checkbox sama sekali" (dicari lewat teks ☐/☒ polos, nihil).
  Investigasi lebih dalam (cek `w14:checked` langsung, bukan cuma teks
  visual) membuktikan itu SALAH — keempatnya (Low/Medium/High/Extreme)
  SAMA-SAMA punya Word content-control (`<w:sdt><w14:checkbox>`) TERSISIP
  DI TENGAH paragraf (beda dari Table 3 yang sdt-nya membungkus SELURUH
  sel) — cuma glyph run-nya (☐/☒ yang tampil) KOSONG untuk High/Extreme di
  dokumen sumber, padahal `w14:checked` attribute-nya `val="1"` — Word/
  LibreOffice tetap merender kotak tercentang dari metadata itu, TIDAK
  peduli isi run-nya kosong. **Kalau mencari checkbox di masa depan, WAJIB
  cek `w14:checked` langsung (via `element.getElementsByTagNameNS`), JANGAN
  simpulkan "tidak ada checkbox" cuma dari pencarian teks ☐/☒ yang nihil.**
  `jsaToggleInlineSdtCheckbox()` (beda dari `jsaSetSdtCheckbox()` yang punya
  Table 3 — itu untuk sdt yang membungkus SELURUH `<w:tc>`) menangani pola
  "sdt tersisip di tengah paragraf" ini: update `w14:checked` attribute DAN
  karakter run yang tampil sekaligus. Extreme (tc4) unik — py 2 sdt terpisah
  dalam 1 sel (range 18-22 dan 23-25 digabung teks "or") — dipetakan ke 2
  opsi state terpisah (`extreme1`/`extreme2`) lewat index sdt ke-0/ke-1.
- **Table 2 (JSA) turun jadi 4 kolom** (Work Sequence|Hazards|Risk|Control
  Measures, `JSA_COLW = [4765,2610,2700,5220]`) — kolom "No." terpisah yang
  ada di v1 SUDAH TIDAK ADA. Nomor step sekarang ditulis MANUAL sebagai
  bagian dari teks Work Sequence sendiri (lihat contoh asli di dokumen
  sumber: "6. Housekeeping area kerja", "7. Manual Handling Peralatan") —
  `jsaHazardTableRow()` mengikuti pola ini (`stepNo + '. ' + stepText`).
  Border/font tetap sama persis polanya (dotted seragam, dll) cuma index
  kolom bergeser semua (WorkSeq sekarang index 0, bukan 1).
- **Table 1 v2**: field baru yang ditambahkan jadi dinamis — RISK TO TRIP
  No. (row 3 tc1, 1 paragraf gabungan label+value), Risk Level (lihat poin
  di atas), Online/Offline utk baris UNIT/SYSTEM/EQUIPMENT (row 6/7/8
  tc1/tc2, 1 pilihan berlaku sekaligus utk ketiganya — user TIDAK PERNAH
  mengisi campur di form aslinya). **Signature role "Applicant" HILANG dari
  template v2** (diganti render row baru: Operation Supervisor/POC, RIC,
  Maintenance Supervisor/ENG/Call Out Leader, Health & Safety, Intersection
  Spv (FA/Chem) — 5 role, bukan lagi termasuk Applicant terpisah).
- **🆕 Insight "Additional Approval" otomatis dari Risk Level**: template
  v2 punya baris "Additional Approval: Dept. Manager (11-17) / Sr. Manager
  (18-22) / President Director (23-25)" (row 26/27) — RANGE-nya PERSIS SAMA
  dengan opsi Risk Level (row 2). Artinya pilihan approval tambahan bisa
  DITURUNKAN OTOMATIS dari Risk Level yang dipilih user (Low/Medium -> tidak
  butuh approval tambahan sama sekali, High -> Dept. Manager, Extreme
  18-22 -> Sr. Manager, Extreme 23-25 -> President Director) — TIDAK perlu
  dropdown terpisah "pilih approver mana". `jsaRiskLevel` (select) +
  `jsaRenderApprovalHint()` (info banner live) + `jsaSigAdditionalApproval`
  (nama, cuma 1 input, diisi ke slot row 27 yang sesuai) mengimplementasikan
  ini. `JSA_RISK_LEVEL_APPROVAL` (map level->label) satu-satunya tempat yang
  perlu diubah kalau range risiko/approver berubah di masa depan.
- **Checklist Table 1 (Plant Process Hazard Identification + Risk detail)**
  — 42 item dinamis (`JSA_CHECKLIST_ITEMS`, tiap entry `{key,label,row,
  labelCol,cbCol}` hasil pembacaan XML mentah SATU PER SATU, BUKAN tebakan)
  dirender generik lewat loop (`jsaRenderChecklist()`) supaya tidak perlu
  nulis ~40 blok HTML/JS berulang. **Item yang SENGAJA dilewati** (bukan
  kelupaan): sel-sel yang ternyata HEADER GRUP (mis. "Hazardous Substances",
  "Work Environment", "Fire Risk", "Electrical Hazard", "Others" — masing-
  masing punya sub-kolom "YES"/"NO" sendiri tanpa checkbox tunggal yang
  jelas) dan slot hazard placeholder `"…"` (belum diisi nama hazard apa pun
  di dokumen sumber). **Kalau nambah item checklist baru ke sini**, WAJIB
  verifikasi row/col-nya dulu lewat baca XML mentah `jsa_template.docx`
  (`jsaDirectChildren(row,'tc')[idx]`) — JANGAN tebak dari tampilan visual
  Word/PDF, kolom sering bergeser antar baris karena grup header vs item
  biasa punya jumlah sel berbeda (lihat riwayat percakapan untuk mapping
  lengkap per baris kalau perlu verifikasi ulang).
- **Table 3 (CONTROL MEASURES SELECTION + Additional Control Measures +
  Warning and Instruction to RIC) ternyata SATU TABEL BERSARANG** (nested
  `<w:tbl>`) di dalam SATU sel Table 3 luar yang cuma 1 baris — python-docx
  `document.tables` TIDAK mendeteksi tabel bersarang ini sebagai tabel
  terpisah (makanya riset awal sempat salah kira Table 3 "kosong, 1 baris
  doang"). `jsaGetNestedControlTable()` mengambilnya via
  `jsaDirectChildren(outerTc,'tbl')[0]`.
  - **Control Measures Selection** (36 item, row 1-18 tabel bersarang) pakai
    Word content-control ASLI yang membungkus SELURUH `<w:tc>` (`<w:sdt>`
    sebagai DIRECT CHILD `<w:tr>`, bukan `<w:tc>` biasa) — `jsaLogicalCells()`
    membaca campuran `<w:tc>` polos dan `<w:sdt><w:sdtContent><w:tc>` dalam
    urutan yang benar, `jsaSetSdtCheckbox()` update `w14:checked` + glyph
    run sekaligus (BEDA fungsi dari `jsaToggleInlineSdtCheckbox()` di atas
    yang untuk sdt-di-tengah-paragraf, Table 3 sdt-nya membungkus SELURUH
    sel). `JSA_CONTROL_MEASURES_ITEMS` (36 entry, `{key,label,row,side}`,
    `side` 0=kolom kiri/1=kolom kanan) + `jsaRenderControlMeasures()`
    generik seperti checklist Table 1.
  - **Additional Control Measures** (row 20-23 tabel bersarang, 4 slot)
    dinamis lewat 4 input teks + tombol **"⚡ Isi Otomatis dari Control
    Measures di Step"** (`jsaAutoFillAdditionalMeasures()`) — SESUAI
    PERMINTAAN EKSPLISIT user. Ambil semua baris Control Measures yang
    sudah diketik user di step manapun (Table 2), dedupe (case-insensitive),
    isi ke 4 slot; kalau lebih dari 4 unik, KASIH TAHU user lewat alert
    berapa yang tidak ikut kepotong (bukan diam-diam buang). Format akhir
    tiap slot SELALU "N. <isi>" (nomor tetap ada walau kosong, persis pola
    template asli).
  - **Warning and Instruction to RIC (row 24-28 tabel bersarang) TIDAK
    PERNAH disentuh kode apa pun di `jsaFillTable3()`** — SESUAI PERMINTAAN
    EKSPLISIT user ("kecuali warning dan instruction tidak boleh dirubah").
    Kalau nanti ada permintaan ubah bagian ini lagi, WAJIB konfirmasi ulang
    ke user dulu sebelum coding — ini pengecualian yang sengaja, bukan
    kelupaan.
- **Diverifikasi lewat selftest otomatis** (pola sama seperti v1 — headless
  Chrome + local HTTP server sementara, kode selftest dihapus lagi dari
  `jsa_report.html` setelah lolos): isi SEMUA field baru + checklist +
  Control Measures + 2 section (A dan C, B sengaja dikosongkan buat
  verifikasi section-skip masih jalan) + generate, lalu re-parse hasil akhir
  dan cek: semua field baru benar, `w14:checked` Risk Level PERSIS sesuai
  pilihan (termasuk 2-sdt-dalam-1-sel Extreme), section B (kosong) tidak
  tercetak, konten contoh job asli (`7BG-PDSH-545`, dst) hilang total dari
  Table 1/2, DAN Warning/Instruction (row 24-28) tetap utuh 100%. Hasil
  akhir juga dirender ke PDF lewat LibreOffice headless **HANYA untuk
  verifikasi visual internal** (checkbox tercentang benar secara visual,
  border/layout tidak korup) — TIDAK pernah dikirim ke user sebagai
  deliverable, sesuai instruksi "tidak butuh PDF sama sekali".
