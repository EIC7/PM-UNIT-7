/**
 * ==========================================================================
 * KONFIGURASI MODUL: Coal Silo Level Transmitter
 * ==========================================================================
 * Pola persis so2.config.js (deviationPairs beforeVsAfter) -- DCS Reading
 * (As Found) vs DCS Reading (As Left) adalah pasangan deviasi alami di
 * checksheet ini (analog Before/After kalibrasi).
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var CSL_TAG_IDS = ['BF-LI-500A', 'BF-LI-500B', 'BF-LI-500C', 'BF-LI-500D', 'BF-LI-500E', 'BF-LI-500F']
  .map(function (u) { return 'CSL-' + u; });

window.DCS_MODULES['Coal Silo Level Transmitter'] = {
  key: 'Coal Silo Level Transmitter',
  tabLabel: 'Coal Silo Level',
  tabOrder: 12,
  adapterKey: 'Coal Silo Level Transmitter',
  tagIds: CSL_TAG_IDS,

  deviationPairs: [
    {
      key: 'asFoundVsAsLeft',
      label: 'Koreksi Kalibrasi (As Found − As Left)',
      seriesA: 'DCSReading',
      seriesB: 'DCSReadingAsLeft',
      toleranceValue: null,
      unit: '%',
      description: 'Selisih DCS Reading As Found vs As Left tiap kalibrasi. Tren menjauh dari 0 = indikasi transmitter makin sering drift.'
    }
  ],

  kpis: [
    { key: 'lastAsFound',   label: 'As Found Terakhir',  source: 'lastValue', series: 'DCSReading' },
    { key: 'lastAsLeft',    label: 'As Left Terakhir',   source: 'lastValue', series: 'DCSReadingAsLeft' },
    { key: 'lastDeviation', label: 'Koreksi Terakhir',   source: 'lastDeviation', pair: 'asFoundVsAsLeft' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',              label: 'Tanggal' },
    { key: 'pic',                label: 'Teknisi' },
    { key: 'DCSReading',         label: 'As Found (%)' },
    { key: 'DCSReadingAsLeft',   label: 'As Left (%)' },
    { key: 'OmronReading',       label: 'Omron Reading' },
    { key: 'recordId',           label: 'Record' }
  ]
};
