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
