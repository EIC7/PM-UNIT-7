/**
 * ==========================================================================
 * DEFAULT TAGS — O2 Weekly Outlet
 * ==========================================================================
 * Sumber: weekly_calibration_o2_outlet.html (modul Supabase
 * 'PM_O2_WEEKLY_OUTLET'). Lihat js/adapters/o2-outlet-adapter.js.
 *
 * 6 channel = 6 tag. BEDA dari O2 Inlet: form Outlet cuma punya 1
 * pembacaan (O2Reading) per channel, TIDAK ADA before/after kalibrasi —
 * jadi series utama di sini cuma O2Reading (tercentang default). Series
 * kesehatan cell (Voltage/Temperature/Lifetime/Resistance) terdaftar
 * defaultVisible:false, tersedia lewat toggle TAG LIST.
 *
 * ENGINEERING RANGE 0-25%: sama asumsi dengan O2 Inlet, sesuaikan kalau
 * ada spesifikasi instrumen aktual.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

var O2_OUTLET_CHANNELS = [
  { ch: 1, tagCode: '7BG-AI-570A', desc: 'Secondary Air Heater 7A Gas Outlet — Analyzer 1' },
  { ch: 2, tagCode: '7BG-AI-571A', desc: 'Secondary Air Heater 7B Gas Outlet — Analyzer 1' },
  { ch: 3, tagCode: '7BG-AI-572',  desc: 'Primary Air Heater 7 Gas Outlet — Analyzer 1' },
  { ch: 4, tagCode: '7BG-AI-573',  desc: 'Primary Air Heater 7 Gas Outlet — Analyzer 2' },
  { ch: 5, tagCode: '7BG-AI-570B', desc: 'Secondary Air Heater 7B Gas Outlet — Analyzer 1' },
  { ch: 6, tagCode: '7BG-AI-571B', desc: 'Secondary Air Heater 7B Gas Outlet — Analyzer 2' }
];

var O2_OUTLET_COLORS = ['#ab2121', '#9c691e', '#667917', '#1a8946', '#21abab', '#2158ab'];

O2_OUTLET_CHANNELS.forEach(function (c, idx) {
  var color = O2_OUTLET_COLORS[idx % O2_OUTLET_COLORS.length];
  window.DCS_DEFAULT_TAGS.push({
    id: 'O2-OUTLET-CH' + c.ch,
    name: 'O2 Outlet Ch' + c.ch + ' (' + c.tagCode + ')',
    description: c.desc + ' — pembacaan O2%, per kejadian PM mingguan',
    unit: '%',
    engineeringLow: 0, engineeringHigh: 25, min: 0, max: 25, chartMax: 25,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'PM_O2_WEEKLY_OUTLET', updateInterval: null,
    series: [
      { key: 'O2Reading',   label: 'O2 Reading (%)',     color: color },
      { key: 'Voltage',     label: 'Voltage (mV)',       color: '#7a8a99', defaultVisible: false },
      { key: 'Temperature', label: 'Temperature (°C)',   color: '#99847a', defaultVisible: false },
      { key: 'Lifetime',    label: 'Lifetime (mo)',      color: '#8a7a99', defaultVisible: false },
      { key: 'Resistance',  label: 'Resistance (Ω)',     color: '#5a6b76', defaultVisible: false }
    ]
  });
});
