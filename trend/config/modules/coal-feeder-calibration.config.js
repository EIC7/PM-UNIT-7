/**
 * ==========================================================================
 * KONFIGURASI MODUL: Coal Feeder Calibration
 * ==========================================================================
 * BEDA dari SO2/O2 Inlet: tidak ada pasangan series alami untuk panel
 * deviasi otomatis -- Cal1DeviationAvg/Cal2DeviationAvg SUDAH BERUPA nilai
 * deviasi itu sendiri (bukan selisih 2 pembacaan mentah seperti DCS vs
 * Local), jadi deviationPairs sengaja dikosongkan (module-view.js aman
 * menangani array kosong ini, lihat renderDeviationPanels()).
 *
 * 2026-08-30: tagIds sekarang 6 (COAL-FEEDER-A..F, satu per feeder tetap
 * dari dropdown baru di coal_feeder_calibration.html) -- dulu cuma 1 tag
 * agregat. kpis di bawah otomatis dirender PER TAG (grup) oleh
 * module-view.js, sama pola dengan modul multi-channel lain (O2 dkk),
 * tidak perlu diubah strukturnya.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var COAL_FEEDER_TAG_IDS = ['A', 'B', 'C', 'D', 'E', 'F'].map(function (l) { return 'COAL-FEEDER-' + l; });

window.DCS_MODULES['Feeder Calibration'] = {
  key: 'Feeder Calibration',
  tabLabel: 'Coal Feeder Calibration',
  tabOrder: 11,
  adapterKey: 'Feeder Calibration',
  tagIds: COAL_FEEDER_TAG_IDS,

  deviationPairs: [],

  kpis: [
    { key: 'lastCal1Dev',   label: 'Deviasi Cal 1 Terakhir', source: 'lastValue', series: 'Cal1DeviationAvg' },
    { key: 'lastCal2Dev',   label: 'Deviasi Cal 2 Terakhir', source: 'lastValue', series: 'Cal2DeviationAvg' },
    { key: 'lastDemand100', label: 'Feed Rate @ 100% Terakhir', source: 'lastValue', series: 'Demand100FlowRate' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',   label: 'Tanggal' },
    { key: 'pic',    label: 'Teknisi' },
    { key: 'Cal1DeviationAvg',  label: 'Dev Cal 1 (%)' },
    { key: 'Cal2DeviationAvg',  label: 'Dev Cal 2 (%)' },
    { key: 'Demand100FlowRate', label: 'Feed Rate 100% (t/h)' },
    { key: 'recordId', label: 'Record' }
  ]
};
