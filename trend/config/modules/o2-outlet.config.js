/**
 * ==========================================================================
 * KONFIGURASI MODUL: O2 Weekly Outlet
 * ==========================================================================
 * BEDA dari O2 Inlet/SO2/CEMS: form Outlet TIDAK punya before/after atau
 * actual/expected -- cuma 1 pembacaan O2Reading per channel, jadi TIDAK ADA
 * pasangan deviasi alami. deviationPairs sengaja dikosongkan (module-view.js
 * menangani ini dengan aman -- panel deviasi otomatis tidak dirender kalau
 * array-nya kosong, lihat renderDeviationPanels()). Fokus di sini murni
 * trend nilai O2Reading + KPI kesehatan cell dari series tambahan adapter.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var O2_OUTLET_TAG_IDS = [1, 2, 3, 4, 5, 6].map(function (n) { return 'O2-OUTLET-CH' + n; });

window.DCS_MODULES['O2_WEEKLY_OUTLET'] = {
  key: 'O2_WEEKLY_OUTLET',
  tabLabel: 'O2 Weekly Outlet',
  tabOrder: 5,
  adapterKey: 'O2_WEEKLY_OUTLET',
  tagIds: O2_OUTLET_TAG_IDS,

  deviationPairs: [],

  kpis: [
    { key: 'lastO2Reading', label: 'O2 Reading Terakhir', source: 'lastValue', series: 'O2Reading' },
    { key: 'lastVoltage',   label: 'Voltage Terakhir',    source: 'lastValue', series: 'Voltage' },
    { key: 'lastResistance', label: 'Resistance Terakhir', source: 'lastValue', series: 'Resistance' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',        label: 'Tanggal' },
    { key: 'pic',         label: 'Teknisi' },
    { key: 'O2Reading',   label: 'O2 Reading (%)' },
    { key: 'Voltage',     label: 'Voltage (mV)' },
    { key: 'Temperature', label: 'Temp (°C)' },
    { key: 'Lifetime',    label: 'Lifetime (mo)' },
    { key: 'Resistance',  label: 'Resistance (Ω)' },
    { key: 'recordId',    label: 'Record' }
  ]
};
