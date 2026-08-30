/**
 * ==========================================================================
 * KONFIGURASI MODUL: Flow Meter FGD Inlet & Quencher
 * ==========================================================================
 * Pola persis so2.config.js / o2-inlet.config.js (deviationPairs
 * beforeVsAfter) — Flow Meter FGD punya pembacaan Before/After Cleaning &
 * Correction per PM 1 Yearly Inspection, jadi cetakan yang sama berlaku
 * langsung tanpa modifikasi ke module-view.js/chart-manager.js/ui-manager.js.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var FM_TREND_TAG_IDS = ['101', '103', '201', '203'].map(function (k) { return 'FM-' + k; });

window.DCS_MODULES['Flow Meter FGD'] = {
  key: 'Flow Meter FGD',
  tabLabel: 'Flow Meter FGD',
  tabOrder: 6,
  adapterKey: 'Flow Meter FGD',
  tagIds: FM_TREND_TAG_IDS,

  deviationPairs: [
    {
      key: 'beforeVsAfter',
      label: 'Koreksi Flow (Before − After)',
      seriesA: 'Before',
      seriesB: 'After',
      toleranceValue: null, // tidak ada batas baku -- dipakai untuk lihat tren drift, bukan pass/fail
      unit: 'm3/Hr',
      description: 'Besaran koreksi flow (m3/Hr) yang dilakukan tiap PM 1 Yearly Inspection & Cleaning. Tren menjauh dari 0 dari waktu ke waktu = indikasi transmitter makin sering drift/kotor.'
    }
  ],

  kpis: [
    { key: 'lastBefore',    label: 'Before Terakhir',   source: 'lastValue', series: 'Before' },
    { key: 'lastAfter',     label: 'After Terakhir',    source: 'lastValue', series: 'After' },
    { key: 'lastDeviation', label: 'Koreksi Terakhir',  source: 'lastDeviation', pair: 'beforeVsAfter' },
    { key: 'daysSinceCal',  label: 'Hari Sejak PM', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',   label: 'Tanggal' },
    { key: 'pic',    label: 'Teknisi' },
    { key: 'Before', label: 'Before (m3/Hr)' },
    { key: 'After',  label: 'After (m3/Hr)' },
    { key: 'InsertionFactor', label: 'Insertion Factor' },
    { key: 'ProfileFactor',   label: 'Profile Factor' },
    { key: 'recordId', label: 'Record' }
  ]
};
