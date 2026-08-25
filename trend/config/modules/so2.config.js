/**
 * ==========================================================================
 * KONFIGURASI MODUL: SO2 Scrubber Inlet
 * ==========================================================================
 * File ini yang dibaca ModuleView (js/module-view.js) untuk membangun:
 *   - Tab di UI ("SO2" di tab bar)
 *   - Panel deviasi otomatis (selisih 2 series + band toleransi)
 *   - Kartu KPI ringkasan di atas chart
 *   - Kolom yang ditampilkan di tabel log record
 *
 * INI CETAKAN untuk modul lain. Menambah modul baru (mis. FEGT) = duplikasi
 * file ini jadi fegt.config.js + sesuaikan field-nya + buat adapter-nya di
 * js/adapters/fegt-adapter.js — TIDAK perlu ubah kode module-view.js,
 * chart-manager.js, atau ui-manager.js sama sekali.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['SO2'] = {
  key: 'SO2',
  tabLabel: 'SO2 Scrubber Inlet',
  tabOrder: 1,
  adapterKey: 'SO2',           // harus cocok dengan ADAPTERS['SO2'] di historical-manager.js
  tagIds: ['SO2-7FC-AT-7A', 'SO2-7FC-AT-7B'], // subset dari DCS_DEFAULT_TAGS yang termasuk tab ini

  // ── Panel deviasi otomatis ──────────────────────────────────────────
  // Tiap entry = 1 pasangan series yang selisihnya dihitung otomatis oleh
  // ModuleView dan digambar sebagai chart terpisah di bawah chart utama.
  deviationPairs: [
    {
      key: 'dcsVsLocal',
      label: 'Deviasi DCS − Local',
      seriesA: 'DCS',
      seriesB: 'Local',
      // Toleransi ±2% dari span (461 ppm) — bisa disesuaikan per kebutuhan.
      toleranceValue: 461 * 0.02,
      unit: 'ppm',
      description: 'Selisih pembacaan DCS vs Local per kejadian kalibrasi. Di luar band = periksa transmisi sinyal / kalibrasi DCS.'
    },
    {
      key: 'beforeVsAfter',
      label: 'Koreksi Kalibrasi (Before − After)',
      seriesA: 'Before',
      seriesB: 'After',
      toleranceValue: null, // tidak ada batas baku — dipakai untuk lihat tren drift, bukan pass/fail
      unit: 'ppm',
      description: 'Besaran koreksi yang dilakukan tiap kalibrasi. Tren naik dari waktu ke waktu = indikasi analyzer makin sering drift (evaluasi interval kalibrasi / kondisi analyzer).'
    }
  ],

  // ── Kartu KPI ringkasan ──────────────────────────────────────────────
  kpis: [
    { key: 'lastDcs',        label: 'DCS Terakhir',       source: 'lastValue', series: 'DCS' },
    { key: 'lastLocal',      label: 'Local Terakhir',     source: 'lastValue', series: 'Local' },
    { key: 'lastDeviation',  label: 'Deviasi Terakhir',   source: 'lastDeviation', pair: 'dcsVsLocal' },
    { key: 'daysSinceCal',   label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  // ── Kolom tabel log record ────────────────────────────────────────────
  logTableColumns: [
    { key: 'time',   label: 'Tanggal' },
    { key: 'pic',    label: 'Teknisi' },
    { key: 'DCS',    label: 'DCS' },
    { key: 'Local',  label: 'Local' },
    { key: 'Before', label: 'Before' },
    { key: 'After',  label: 'After' },
    { key: 'recordId', label: 'Record' }
  ]
};
