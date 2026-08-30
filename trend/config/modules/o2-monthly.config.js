/**
 * ==========================================================================
 * KONFIGURASI MODUL: O2 Monthly Cleaning
 * ==========================================================================
 * Beda dari O2 Weekly Outlet (deviationPairs:[]): modul BULANAN ini punya
 * bacaan Before/After cleaning O2% (data.outletReadings), jadi ADA
 * pasangan deviasi alami — pola sama persis dengan O2 Weekly Inlet
 * (so2.config.js style). Cuma channel Outlet (6) yang punya bacaan angka
 * di modul ini — channel Inlet murni dokumentasi foto, lihat catatan di
 * default-tags-o2-monthly.js.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var O2_MONTHLY_TAG_IDS = [1, 2, 3, 4, 5, 6].map(function (n) { return 'O2-MONTHLY-OUTLET-CH' + n; });

window.DCS_MODULES['PM_O2_MONTHLY_CLEANING'] = {
  key: 'PM_O2_MONTHLY_CLEANING',
  tabLabel: 'O2 Monthly Cleaning',
  tabOrder: 13,
  adapterKey: 'PM_O2_MONTHLY_CLEANING',
  tagIds: O2_MONTHLY_TAG_IDS,

  deviationPairs: [
    {
      key: 'beforeVsAfter',
      label: 'Koreksi Cleaning (Before − After)',
      seriesA: 'Before',
      seriesB: 'After',
      toleranceValue: null, // tidak ada batas baku -- dipakai untuk lihat tren drift, bukan pass/fail
      unit: '%',
      description: 'Besaran koreksi O2% yang dihasilkan tiap cleaning bulanan analyzer Outlet. Tren menjauh dari 0 dari waktu ke waktu = indikasi analyzer makin sering kotor/drift antar cleaning.'
    }
  ],

  kpis: [
    { key: 'lastBefore',    label: 'Before Terakhir',   source: 'lastValue', series: 'Before' },
    { key: 'lastAfter',     label: 'After Terakhir',    source: 'lastValue', series: 'After' },
    { key: 'lastDeviation', label: 'Koreksi Terakhir',  source: 'lastDeviation', pair: 'beforeVsAfter' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Cleaning', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',   label: 'Tanggal' },
    { key: 'pic',    label: 'Teknisi' },
    { key: 'Before', label: 'Before' },
    { key: 'After',  label: 'After' },
    { key: 'Voltage',    label: 'Voltage (mV)' },
    { key: 'Resistance', label: 'Resistance (Ω)' },
    { key: 'recordId', label: 'Record' }
  ]
};
