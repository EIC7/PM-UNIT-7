# Trend Fitur.MD — DCS Trend Monitoring System

Status: **Phase awal — HISTORICAL TREND aktif, modul SO2 Scrubber Inlet**
Sumber data: **read-only** dari Supabase `pm_records` (project sama dengan repo `Mahfudjtf/PM-UNIT-7`)

---

## 1. Apa yang sudah berfungsi penuh (bukan dummy)

| Fitur | Status | Keterangan |
|---|---|---|
| Tag List panel (search, checkbox show/hide) | ✅ | 2 tag aktif: `SO2-7FC-AT-7A`, `SO2-7FC-AT-7B` |
| Tag Details panel | ✅ | ID, name, unit, engineering range, source, modul |
| Historical Trend — Quick Range | ✅ | 5M/15M/30M/1H/4H/8H/12H/24H/7D/30D/90D + CUSTOM |
| Historical Trend — Custom Range (start/end date+time) | ✅ | Validasi start < end |
| LOAD DATA → fetch Supabase real-time | ✅ | `pm_records` difilter modul SO2 + rentang waktu (`updated_at`) |
| Trend Graph (ECharts) | ✅ | Multi-series, zoom (scroll + slider), tooltip cursor, time-axis auto-format |
| AUTO SCALE | ✅ | Reset zoom ke 100% |
| EXPORT CSV / JSON / IMAGE | ✅ | Export tag yang sedang dipilih |
| Status Bar | ✅ | Total tag, active trend, jumlah record ter-load |
| Mode switch LIVE / HISTORICAL | ✅ (UI) | Tombol berfungsi; LIVE menampilkan notice jujur (lihat §3) |
| `window.DCSTrend` internal API | ✅ | `registerTag`, `updateTag`, `getTag`, `getAllTags`, `deleteTag`, `setTagVisibility`, `getHistoricalData`, `exportData`, `broadcastTagUpdate` |
| BroadcastChannel (`dcs_trend_channel`) | ✅ (siap) | Listener aktif, siap terima `TAG_UPDATE`/`TAG_REGISTER` dari halaman lain |

**Tidak ada tombol dummy** — setiap tombol yang tampil di UI terhubung ke logic nyata. Fitur yang belum diimplementasikan (lihat §3) sengaja **tidak** ditaruh sebagai tombol di UI supaya tidak menyesatkan.

---

## 2. Bagaimana data SO2 diproses

**Sumber:** `so2.html` di repo `PM-UNIT-7` bukan feed proses kontinu — dia adalah **form checksheet kalibrasi**. Setiap kali form disimpan, 1 baris baru masuk ke `pm_records` dengan `data.analyzer` berisi:

```
{ aDCS, aLocal, aZero, aSpan, aBefore, aAfter,   // a. Scrubber A Inlet SO2 (7FC-AT-7A)
  cDCS, cLocal, cZero, cSpan, cBefore, cAfter }  // b. Scrubber B Inlet SO2 (7FC-AT-7B)
```

Karena itu, "Historical Trend" di sini adalah **perbandingan pembacaan DCS vs Local dari waktu ke waktu (antar kejadian kalibrasi)**, bukan trend proses per-detik. Sesuai konfirmasi:

- Tag `SO2-7FC-AT-7A` → series **DCS Reading** (`aDCS`) vs **Local Reading** (`aLocal`)
- Tag `SO2-7FC-AT-7B` → series **DCS Reading** (`cDCS`) vs **Local Reading** (`cLocal`)
- X-axis = `updated_at` (fallback `created_at` → `tanggal`) tiap record
- Engineering range chart: 0–461 ppm (nilai default Span pada form `so2.html`)

Modul HTML lain di repo (`opacity.html`, `fegt.html`, `ph-analyzer.html`, `flow-meter-fgd.html`, `coal-silo-level.html`, `cems_calibration.html`) **belum** diaktifkan sebagai tag — sesuai arahan, checksheet/inspeksi (`checksheet-*`, `dcs-hmi-inspection`, dll) dilewati untuk sekarang.

---

## 3. Yang SENGAJA belum aktif (bukan lupa — keputusan desain)

- **LIVE TREND**: `LIVE_TREND_ENABLED = false` di `config/system-config.js`. Repo PM-UNIT-7 tidak punya feed proses real-time (semua event-based via form kalibrasi), jadi Live Trend butuh sumber data lain (simulator/API/WebSocket) yang belum ditentukan. Arsitektur (`js/live-trend-engine.js`, `js/simulator.js`) sudah disiapkan penuh — tinggal set flag `true` + sambungkan sumber data saat siap.
- **ADD TAG manual (modal)** dan **right-click menu** (edit/duplicate/delete tag) — belum dibangun di Phase ini. `TagManager` & `DCSTrend.registerTag()` sudah siap menerimanya (backend logic-nya sudah ada), tinggal dibuatkan modal UI-nya.
- **Alarm limit visualization** (garis HH/H/L/LL) — dikosongkan untuk 2 tag SO2 karena data kalibrasi ini tidak punya alarm proses formal (bukan PV real-time). Field `alarmHigh` dkk di tag object di-set `null`.
- **Dual cursor (Cursor A/B, ΔT, ΔValue, Rate of Change)** — belum diimplementasikan; saat ini pakai cursor tunggal bawaan ECharts (`tooltip axisPointer`).

---

## 4. Lokasi di repo & cara menjalankan

Folder ini ditaruh sebagai **`/trend/`** di root repo `PM-UNIT-7` — sejajar dengan folder `assets/`, jadi **tidak menimpa** `index.html` dashboard utama yang sudah ada.

```
PM-UNIT-7/
├── index.html              ← dashboard utama (TIDAK diubah/ditimpa)
├── assets/
├── shared.js / shared.css
├── so2.html, opacity.html, dst  (form-form PM yang sudah ada)
└── trend/                  ← project ini
    ├── index.html          (dibuka lewat PM-UNIT-7/trend/index.html)
    ├── css/
    ├── config/
    ├── js/
    └── Trend Fitur.MD
```

1. Buka `trend/index.html` di browser (tidak butuh build step — vanilla JS). Semua path CSS/JS di dalamnya relatif terhadap file ini sendiri, jadi tetap jalan normal walau ditaruh di subfolder.
2. Sistem otomatis: load tag SO2 → connect ke Supabase → load data 90 hari terakhir (default range) → render chart.
3. Klik tag di panel kiri untuk pindah trend. Klik quick range atau isi Custom Range → **LOAD DATA** untuk refresh.
4. Jika tidak ada data pada rentang waktu yang dipilih, chart akan menampilkan pesan "TIDAK ADA DATA PADA RENTANG WAKTU INI" (bukan chart kosong tanpa keterangan).

**Catatan koneksi:** memakai anon key Supabase read-only yang sama dengan `shared.js` di PM-UNIT-7. Tidak ada operasi write/delete dari sistem trend ini.

**Akses dari dashboard utama:** belum otomatis ditautkan — `index.html` dashboard di root repo belum diubah. Tambahkan tombol/link manual ke `trend/index.html` di sana kalau mau bisa diakses dari menu utama (lihat §5).

---

## 5. Struktur file & menautkan ke dashboard

```
trend/
├── index.html
├── css/
│   ├── style.css        (layout & struktur)
│   └── dcs-theme.css     (warna & tema dark industrial)
├── config/
│   ├── system-config.js  (Supabase, quick range, flags LIVE/HISTORICAL)
│   └── default-tags.js   (definisi tag SO2 A & B)
└── js/
    ├── storage-manager.js       (wrapper localStorage aman)
    ├── supabase-adapter.js      (fetch pm_records, read-only)
    ├── so2-adapter.js           (parser record SO2 → time series)
    ├── tag-manager.js           (registry tag)
    ├── historical-manager.js    (quick range, custom range, load orchestration)
    ├── chart-manager.js         (ECharts wrapper)
    ├── communication-manager.js (BroadcastChannel, CustomEvent, window.DCSTrend API)
    ├── export-manager.js        (CSV/JSON export)
    ├── live-trend-engine.js     (STUB — nonaktif, siap untuk Phase berikutnya)
    ├── simulator.js             (STUB — nonaktif, siap untuk Phase berikutnya)
    ├── ui-manager.js            (DOM wiring)
    └── app.js                   (bootstrap)
```

Untuk menambahkan tombol akses di dashboard utama (`index.html` root repo), tinggal tambah satu tombol/kartu menu yang mengarah ke `trend/index.html`, mengikuti pola tombol menu modul lain yang sudah ada di dashboard tersebut. Belum dilakukan otomatis di sini — repo asal tidak disentuh sampai ada instruksi eksplisit untuk push/edit.

---

## 6. Cara menambah modul baru (mis. Opacity, FEGT, pH)

1. Cek struktur `dbCollectData()` di file HTML modul terkait (repo PM-UNIT-7) untuk tahu field mana yang mau di-plot — ikuti pola diskusi yang sudah dipakai untuk SO2 (analisis dulu field kalibrasi mana yang relevan sebelum asal pilih).
2. Buat `js/<nama>-adapter.js` mengikuti pola `so2-adapter.js` (parse rows → `{ tagId: { seriesKey: [{time,value}] } }`).
3. Tambahkan tag baru di `config/default-tags.js`.
4. Daftarkan adapter baru di `HistoricalManager.ADAPTERS` (`js/historical-manager.js`).
5. Tambahkan `<script>` baru di `index.html`.

Tidak perlu mengubah `chart-manager.js`, `ui-manager.js`, atau `app.js` — arsitektur sudah modular untuk ini.

---

## 7. Pemetaan ke roadmap PDF asli (DCS_Trend_Monitoring_System.pdf)

| Phase (spec asli) | Status di deliverable ini |
|---|---|
| Phase 1 — Live Trend + Simulator | Ditunda (lihat §3) — diganti prioritas Historical dulu sesuai arahan terbaru |
| Phase 2 — Historical Trend, LocalStorage, Zoom, Export CSV | ✅ Aktif (pakai Supabase, bukan localStorage — karena sumber data real) |
| Phase 3 — BroadcastChannel, Interconnection, Auto Tag Discovery | Kerangka siap (`communication-manager.js`), belum ada halaman pengirim aktif |
| Phase 4 — WebSocket, REST API, DB Adapter | `SupabaseAdapter` sudah berperan sebagai DB Adapter nyata (bukan placeholder) |

---

## 8. Hasil Analisis Gap (dibanding trend tool DCS profesional, mis. PI ProcessBook)

Analisis dilakukan dengan membandingkan langsung ke contoh tampilan **PI ProcessBook Trend Display** (referensi visual dari user) dan membaca detail seluruh isi `trend/js/*.js`. Tujuan: menambahkan hal-hal yang membuat sistem ini terasa selevel tool DCS engineer profesional, sebelum diperluas ke semua modul checksheet.

### 8.1 Gap tampilan/UX

| # | Temuan | Detail | File terdampak |
|---|---|---|---|
| 1 | Tidak bisa overlay 2+ tag dalam satu plot | `chart-manager.js` selalu `chart.setOption(option, true)` (replace total) tiap ganti tag; `ui-manager.js` cuma simpan `selectedTagId` tunggal. PI bisa tampilkan `7FC-AT-7A` & `7FC-AT-7B` bersamaan di satu grafik. | `chart-manager.js`, `tag-manager.js`, `ui-manager.js` |
| 2 | Legend tidak menampilkan nilai live/dinamis | Legend ECharts bawaan cuma nama series (toggle show/hide), tidak ada angka seperti di PI (nama + nilai + satuan, ikut berubah sesuai posisi cursor). | `chart-manager.js` |
| 3 | Tidak ada cursor readout box yang snap ke data point | PI punya kotak nilai presisi + garis vertikal solid yang tetap muncul saat cursor digeser/diklik. Punya kita cuma tooltip hover bawaan ECharts (`axisPointer: cross`) yang hilang saat mouse keluar area chart. | `chart-manager.js`, `ui-manager.js` |
| 4 | Tidak ada navigasi geser tanggal (◄ ►) di toolbar | PI punya field tanggal + tombol maju/mundur untuk geser jendela waktu tanpa harus mengetik ulang. Sekarang cuma quick-range preset + custom range sekali input. | `historical-manager.js`, `index.html` |
| 5 | Line chart menyambung gap waktu besar sebagai garis lurus | Data kalibrasi event-based (jarang, tidak reguler) — dua titik berjarak 3 minggu digambar sebagai garis miring kontinu, berpotensi salah dibaca sebagai tren proses. | `chart-manager.js` |

### 8.2 Gap arsitektur data — lebih serius dari sekadar tampilan

| # | Temuan | Detail |
|---|---|---|
| 6 | Query historis tidak scalable, berpotensi kehilangan data diam-diam | `supabase-adapter.js` → `fetchRecords()` selalu ambil **500 record TERBARU dari SELURUH tabel** (semua modul digabung, `order=updated_at.desc&limit=500`), baru difilter modul+waktu **di client**. Tidak ada filter `WHERE modul=eq.X` di level query REST. Tidak ada indikator "data dibatasi 500 record" ke user. Prioritas **tinggi** untuk dibenahi sebelum modul lain masuk. |
| 7 | Tidak ada perhitungan deviasi DCS vs Local (padahal itu tujuan inti alat ini) | `so2-adapter.js` cuma simpan `aDCS`/`aLocal` sebagai 2 series terpisah. Tidak ada series selisih (`aDCS - aLocal`), tidak ada ambang toleransi (mis. ±2% dari span), tidak ada penandaan otomatis titik yang menyimpang. Ini fitur paling bernilai untuk tujuan bisnis alat — mengubah dari "grafik dua garis" jadi alat bantu keputusan. |
| 8 | `recordId` dan `pic` (teknisi) sudah disimpan tapi tidak dipakai | `so2-adapter.js` sudah menyertakan `recordId`/`pic` per titik data, tapi belum disambungkan ke tooltip/detail panel. Quick win — data sudah ada, tinggal ditampilkan. |
| 9 | Tidak ada validasi/indikator kualitas data | Field kosong/null di satu record cuma di-skip diam-diam di adapter, tanpa pesan "N record dilewati karena data tidak lengkap". |
| 10 | Tidak ada caching antar-load | Tiap ganti tag/range selalu fetch ulang 500 record dari awal — boros network, padahal bisa di-cache per sesi. |
| 11 | State tidak persisten lintas reload | `storage-manager.js` sudah siap sebagai wrapper localStorage, tapi cuma dipakai untuk custom tag manual (fitur yang UI-nya belum dibuat). Tag & range terakhir tidak diingat — reload selalu balik ke tag pertama + range 90D default. |

### 8.3 Temuan kritis — audit kesiapan SEMUA modul checksheet untuk trend

Karena rencana ke depan trend ini dipakai untuk **semua HTML checksheet** di repo (bukan cuma SO2), dilakukan audit ke seluruh 28 file HTML modul. Hasilnya: **sumber data tidak seragam**, ini blocker paling mendasar sebelum ekspansi dilakukan.

**Tabel Supabase yang ditemukan (bukan cuma `pm_records`):**

| Tabel | Dipakai oleh | Catatan |
|---|---|---|
| `pm_records` | SO2, Opacity, CEMS, Coal Feeder, Belt Scale (semua varian: b12/e23/e45), FEGT, Flow Meter FGD, Form O2, Generator Stator Leak, Maintenance Report, Mark VIE Inspection, pH Analyzer, PM HG Analyzer, DCS HMI Inspection | Skema `data.{...}` **tidak seragam** antar modul — lihat di bawah |
| `ts_checksheet` | `checksheet-temperature.html` | Skema terpisah total; ada komentar eksplisit di kode "kita tidak pakai dbSave dari shared" |
| `outage_assets` | `checksheet-level-switch.html`, `outage-input.html` | Skema terpisah total |
| `material_warehouse`, `material_jenis`, `material_pengambilan` | `material-warehouse.html` | Data inventaris gudang — bukan data pengukuran/kalibrasi |
| *(tidak ada penyimpanan data pengukuran)* | `device-admin.html` | Murni admin/konfigurasi, tidak relevan untuk trend |

**Bahkan di dalam `pm_records` sendiri, struktur field `data` tidak konsisten per modul:**
- `opacity.html` → `data.checks` (array) + `data.notes`
- `coal_feeder_calibration.html` → `data.{...}` field flat langsung
- `mark_vie_inspection.html` → `data.header` + `data.items` (array inspeksi checklist, bukan angka kontinu)
- `so2.html` → `data.analyzer` (flat) — pola yang sekarang jadi contoh satu-satunya adapter (`so2-adapter.js`)

**Implikasi:**
- `SupabaseAdapter` sekarang **hardcoded** cuma baca `pm_records` (`CFG.TABLE = 'pm_records'`). Modul `checksheet-temperature`, `checksheet-level-switch`, `material-warehouse` **tidak akan pernah muncul** di trend tanpa dukungan multi-tabel.
- Pola "1 file `<nama>-adapter.js` custom per modul" (seperti `so2-adapter.js`) **tidak scalable** untuk 20+ modul — terlalu banyak kerja manual berulang dan rawan human error tiap kali struktur field berbeda.
- Tidak semua modul cocok untuk trend numerik: `mark_vie_inspection.html` dan `dcs-hmi-inspection.html` isinya checklist pass/fail (butuh mode chart **step/discrete**, bukan line chart analog).
- `material-warehouse.html`, `device-admin.html`, `maintenance_report_form.html` kemungkinan besar **di luar cakupan trend** (administratif/inventaris, bukan data pengukuran berkala) — perlu diputuskan eksplisit modul mana yang in-scope.

---

## 9. Rekomendasi & Roadmap Pengembangan Berikutnya

Urutan prioritas berdasarkan dampak terhadap keandalan data dan nilai bisnis alat, bukan sekadar kemudahan implementasi:

| Prioritas | # | Rekomendasi | Kategori |
|---|---|---|---|
| 🔴 Tinggi | 1 | Audit lengkap semua modul checksheet → peta: tabel tujuan, field, tipe data, in-scope/out-of-scope untuk trend | Fondasi |
| 🔴 Tinggi | 2 | `SupabaseAdapter` dukung multi-tabel + query terfilter di server (`WHERE modul=eq.X`), bukan fetch-500-lalu-filter-client | Arsitektur |
| 🔴 Tinggi | 3 | Ganti pola "1 adapter.js custom per modul" → adapter generik berbasis config declaratif (field-map: tabel, path field, tipe numeric/boolean, unit, range) | Arsitektur |
| 🔴 Tinggi | 4 | Series deviasi DCS-vs-Local + ambang toleransi + penandaan otomatis titik menyimpang | Domain-value |
| 🟡 Sedang | 5 | Overlay multi-tag dalam satu plot | UX |
| 🟡 Sedang | 6 | Legend dengan nilai live + cursor snap + garis vertikal readout | UX |
| 🟡 Sedang | 7 | Tag taksonomi berjenjang (grouping per modul/area) — perlu sebelum tag list membengkak jadi 100+ | UX/Skalabilitas |
| 🟡 Sedang | 8 | Mode chart step/discrete untuk modul checklist (Mark VIE, DCS HMI Inspection) | Domain-value |
| 🟡 Sedang | 9 | Tampilkan `recordId`/`pic` di tooltip (data sudah ada, quick win) | Quick win |
| 🟢 Rendah | 10 | Navigasi geser tanggal ◄ ► di toolbar | UX |
| 🟢 Rendah | 11 | Caching antar-load + state persisten (tag/range terakhir) via `storage-manager.js` | Performa |
| 🟢 Rendah | 12 | Indikator kualitas data (record dilewati karena field tidak lengkap) | Robustness |
| ⏸️ Ditunda | 13 | Multi-window trend (dibandingkan side-by-side) | Diputuskan **tidak diperlukan** — cukup ganti tab/judul untuk pindah tampilan |

**Catatan:** Prioritas 1–4 sengaja didahulukan karena tanpa itu, ekspansi trend ke modul lain berisiko menghasilkan data yang salah/hilang diam-diam (bukan cuma "kurang fitur" tapi "berpotensi menyesatkan teknisi") — sejalan dengan prinsip "Tidak ada tombol dummy" di §1 dokumen ini.

