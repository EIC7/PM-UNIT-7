/**
 * ==========================================================================
 * DEFAULT TAGS — O2 Monthly Cleaning
 * ==========================================================================
 * Sumber: form_o2_report.html (modul Supabase PM_O2_MONTHLY_CLEANING,
 * dengan suffix dinamis _INLET / _OUTLET / _INLET_DAN_OUTLET tergantung
 * channel yang diisi saat submit — dicocokkan lewat substring
 * PM_O2_MONTHLY_CLEANING, lihat js/adapters/o2-monthly-adapter.js).
 *
 * PENTING: channel INLET (ch1..ch8) di modul ini TIDAK punya bacaan angka
 * sama sekali — "before"/"after" di sana cuma FOTO dokumentasi cleaning,
 * bukan kalibrasi. Satu-satunya data numerik ada di data.outletReadings
 * (6 channel Outlet, fisik instrumen SAMA dengan
 * weekly_calibration_o2_outlet.html tapi frekuensi bulanan). Makanya hub
 * ini HANYA berisi 6 tag Outlet — bukan 14 (8 inlet + 6 outlet) seperti
 * sekilas mungkin diharapkan dari nama modulnya.
 *
 * Tag id sengaja O2-MONTHLY-OUTLET-CHn (beda dari O2-OUTLET-CHn milik
 * trend_weekly_o2_outlet.html) supaya kedua modul (mingguan vs bulanan,
 * sama-sama Outlet) tidak tertukar tag id-nya di sistem trend.
 *
 * ENGINEERING RANGE 0-25%: rentang tipikal analyzer O2 (ambient ~20.9%) —
 * ASUMSI, sama dengan modul O2 lain, sesuaikan kalau ada spesifikasi
 * instrumen aktual.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

var O2_MONTHLY_OUTLET_CHANNELS = [
  { ch: 1, tagCode: '7BG-AI-570A', desc: 'Secondary Air Heater 7A Gas Outlet — Analyzer 1' },
  { ch: 2, tagCode: '7BG-AI-571A', desc: 'Secondary Air Heater 7B Gas Outlet — Analyzer 1' },
  { ch: 3, tagCode: '7BG-AI-572',  desc: 'Primary Air Heater 7 Gas Outlet — Analyzer 1' },
  { ch: 4, tagCode: '7BG-AI-573',  desc: 'Primary Air Heater 7 Gas Outlet — Analyzer 2' },
  { ch: 5, tagCode: '7BG-AI-570B', desc: 'Secondary Air Heater 7B Gas Outlet — Analyzer 1' },
  { ch: 6, tagCode: '7BG-AI-571B', desc: 'Secondary Air Heater 7B Gas Outlet — Analyzer 2' }
];

var O2_MONTHLY_COLOR_PAIRS = [
  ['#ab2121', '#ca7e72'], ['#9c691e', '#bea254'], ['#667917', '#78983a'],
  ['#246613', '#3e9338'], ['#1a8946', '#4ebc89'], ['#21abab', '#72beca']
];

O2_MONTHLY_OUTLET_CHANNELS.forEach(function (c, idx) {
  var pair = O2_MONTHLY_COLOR_PAIRS[idx % O2_MONTHLY_COLOR_PAIRS.length];
  window.DCS_DEFAULT_TAGS.push({
    id: 'O2-MONTHLY-OUTLET-CH' + c.ch,
    name: 'O2 Monthly Outlet Ch' + c.ch + ' (' + c.tagCode + ')',
    description: c.desc + ' — Before/After cleaning O2%, per kejadian PM bulanan',
    unit: '%',
    engineeringLow: 0, engineeringHigh: 25, min: 0, max: 25, chartMax: 25,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'PM_O2_MONTHLY_CLEANING', updateInterval: null,
    series: [
      { key: 'Before', label: 'Before Cleaning', color: pair[0] },
      { key: 'After',  label: 'After Cleaning',  color: pair[1] },
      { key: 'Voltage',     label: 'Voltage (mV)',     color: '#3d5a70', defaultVisible: false },
      { key: 'Temperature', label: 'Temperature (°C)', color: '#7a5730', defaultVisible: false },
      { key: 'Lifetime',    label: 'Lifetime (mo)',    color: '#5e4680', defaultVisible: false },
      { key: 'Resistance',  label: 'Resistance (Ω)',   color: '#33505c', defaultVisible: false }
    ]
  });
});
