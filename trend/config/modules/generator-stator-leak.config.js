/**
 * ==========================================================================
 * KONFIGURASI MODUL: Generator Stator Leak Monitoring
 * ==========================================================================
 * Pola persis so2.config.js / o2-inlet.config.js (deviationPairs
 * beforeVsAfter) — 7 parameter kalibrasi/kondisi sistem deteksi kebocoran
 * stator generator, tiap parameter punya Before/After per kejadian PM.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var GSL_TAG_IDS = [
  'GSL-FLOW-RATE',
  'GSL-PURGE-AIR-FLOW',
  'GSL-IA-PRESSURE',
  'GSL-CAL-BOTTLE-PRESSURE',
  'GSL-DO-PROBE-LIFE',
  'GSL-H2-READING',
  'GSL-DO-READING'
];

window.DCS_MODULES['GENERATOR_STATOR_LEAK'] = {
  key: 'GENERATOR_STATOR_LEAK',
  tabLabel: 'Generator Stator Leak',
  tabOrder: 10,
  adapterKey: 'GENERATOR_STATOR_LEAK',
  tagIds: GSL_TAG_IDS,

  deviationPairs: [
    {
      key: 'beforeVsAfter',
      label: 'Koreksi Kalibrasi (Before − After)',
      seriesA: 'Before',
      seriesB: 'After',
      toleranceValue: null,
      unit: '',
      description: 'Selisih nilai parameter sebelum vs sesudah kalibrasi/maintenance tiap kejadian PM.'
    }
  ],

  kpis: [
    { key: 'lastBefore',    label: 'Before Terakhir',  source: 'lastValue', series: 'Before' },
    { key: 'lastAfter',     label: 'After Terakhir',   source: 'lastValue', series: 'After' },
    { key: 'lastDeviation', label: 'Koreksi Terakhir', source: 'lastDeviation', pair: 'beforeVsAfter' },
    { key: 'daysSinceCal',  label: 'Hari Sejak PM',    source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',   label: 'Tanggal' },
    { key: 'pic',    label: 'Teknisi' },
    { key: 'Before', label: 'Before' },
    { key: 'After',  label: 'After' },
    { key: 'recordId', label: 'Record' }
  ]
};
