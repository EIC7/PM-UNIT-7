/**
 * ==========================================================================
 * KONFIGURASI MODUL: O2 Weekly Inlet
 * ==========================================================================
 * Pola persis so2.config.js (deviationPairs beforeVsAfter) — O2 Inlet punya
 * Before/After kalibrasi sama seperti SO2, jadi cetakan yang sama berlaku
 * langsung tanpa modifikasi ke module-view.js/chart-manager.js/ui-manager.js.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var O2_INLET_TAG_IDS = [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return 'O2-INLET-CH' + n; });

window.DCS_MODULES['O2_WEEKLY_INLET'] = {
  key: 'O2_WEEKLY_INLET',
  tabLabel: 'O2 Weekly Inlet',
  tabOrder: 4,
  adapterKey: 'O2_WEEKLY_INLET',
  tagIds: O2_INLET_TAG_IDS,

  deviationPairs: [
    {
      key: 'beforeVsAfter',
      label: 'Koreksi Kalibrasi (Before − After)',
      seriesA: 'Before',
      seriesB: 'After',
      toleranceValue: null, // tidak ada batas baku -- dipakai untuk lihat tren drift, bukan pass/fail
      unit: '%',
      description: 'Besaran koreksi O2% yang dilakukan tiap kalibrasi mingguan. Tren menjauh dari 0 dari waktu ke waktu = indikasi analyzer makin sering drift.'
    }
  ],

  kpis: [
    { key: 'lastBefore',    label: 'Before Terakhir',   source: 'lastValue', series: 'Before' },
    { key: 'lastAfter',     label: 'After Terakhir',    source: 'lastValue', series: 'After' },
    { key: 'lastDeviation', label: 'Koreksi Terakhir',  source: 'lastDeviation', pair: 'beforeVsAfter' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',   label: 'Tanggal' },
    { key: 'pic',    label: 'Teknisi' },
    { key: 'Before', label: 'Before' },
    { key: 'After',  label: 'After' },
    { key: 'CellVoltage',    label: 'Cell V (mV)' },
    { key: 'CellResistance', label: 'Cell R (Ω)' },
    { key: 'recordId', label: 'Record' }
  ]
};
