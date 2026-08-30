/**
 * ==========================================================================
 * KONFIGURASI MODUL: Analyzer Indicator Transmitter (pH)
 * ==========================================================================
 * Pola persis so2.config.js (deviationPairs dcsVsLocal) — pH Analyzer punya
 * pembacaan DCS vs Local sama seperti SO2, cetakan yang sama berlaku
 * langsung tanpa modifikasi ke module-view.js/chart-manager.js/ui-manager.js.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var PH_TAG_IDS = ['CWT-AIT-502', 'CWT-AIT-503', 'CWT-AIT-507', 'CWT-AIT-512', 'CWT-AIT-513', 'CWT-AIT-936']
  .map(function (id) { return 'PH-' + id; });

window.DCS_MODULES['Analyzer Indicator Transmitter (pH)'] = {
  key: 'Analyzer Indicator Transmitter (pH)',
  tabLabel: 'pH Analyzer',
  tabOrder: 9,
  adapterKey: 'Analyzer Indicator Transmitter (pH)',
  tagIds: PH_TAG_IDS,

  deviationPairs: [
    {
      key: 'dcsVsLocal',
      label: 'Deviasi DCS − Local',
      seriesA: 'DCSPH',
      seriesB: 'LocalPH',
      toleranceValue: 0.2, // ±0.2 pH -- ambang umum verifikasi analyzer pH, sesuaikan kalau ada spesifikasi baku
      unit: 'pH',
      description: 'Selisih pembacaan DCS vs Local (pH) per kejadian PM. Di luar band = periksa kalibrasi/transmisi sinyal analyzer.'
    }
  ],

  kpis: [
    { key: 'lastDcs',       label: 'DCS Terakhir',       source: 'lastValue', series: 'DCSPH' },
    { key: 'lastLocal',     label: 'Local Terakhir',     source: 'lastValue', series: 'LocalPH' },
    { key: 'lastDeviation', label: 'Deviasi Terakhir',   source: 'lastDeviation', pair: 'dcsVsLocal' },
    { key: 'daysSinceCal',  label: 'Hari Sejak PM',      source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',    label: 'Tanggal' },
    { key: 'pic',     label: 'Teknisi' },
    { key: 'DCSPH',   label: 'DCS (pH)' },
    { key: 'LocalPH', label: 'Local (pH)' },
    { key: 'Slope',   label: 'Slope' },
    { key: 'Offset',  label: 'Offset' },
    { key: 'recordId', label: 'Record' }
  ]
};
