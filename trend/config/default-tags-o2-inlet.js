/**
 * ==========================================================================
 * DEFAULT TAGS — O2 Weekly Inlet
 * ==========================================================================
 * Sumber: weekly_calibration_o2_inlet.html (modul Supabase
 * 'PM_O2_WEEKLY_INLET'). Lihat js/adapters/o2-inlet-adapter.js untuk detail
 * struktur data mentahnya.
 *
 * 8 channel = 8 tag (1 per elemen Oxygen Analyzer fisik, sama pola dengan
 * SO2: 1 tag = 1 instrumen). Series utama Before/After (O2% pembacaan
 * sebelum/sesudah kalibrasi) tercentang default — dipakai panel deviasi
 * "Koreksi Kalibrasi" (pola persis beforeVsAfter di so2.config.js). Series
 * kesehatan cell (CellVoltage/CellTemperature/CellLifetime/CellResistance)
 * ikut terdaftar tapi defaultVisible:false (tersedia lewat toggle di TAG
 * LIST kalau perlu dilihat, tidak bikin chart utama penuh sesak).
 *
 * ENGINEERING RANGE 0-25%: rentang tipikal analyzer O2 (ambient ~20.9%) —
 * ASUMSI, sesuaikan kalau ada spesifikasi instrumen aktual.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

var O2_INLET_CHANNELS = [
  { ch: 1, tagCode: '7BG-AE-562', desc: 'Secondary Air Heater 7A Gas Inlet — Element 1' },
  { ch: 2, tagCode: '7BG-AE-563', desc: 'Secondary Air Heater 7A Gas Inlet — Element 2' },
  { ch: 3, tagCode: '7BG-AE-564', desc: 'Secondary Air Heater 7A Gas Inlet — Element 3' },
  { ch: 4, tagCode: '7BG-AE-565', desc: 'Secondary Air Heater 7B Gas Inlet — Element 4' },
  { ch: 5, tagCode: '7BG-AE-566', desc: 'Secondary Air Heater 7B Gas Inlet — Element 5' },
  { ch: 6, tagCode: '7BG-AE-567', desc: 'Secondary Air Heater 7B Gas Inlet — Element 6' },
  { ch: 7, tagCode: '7BG-AE-568', desc: 'Primary Air Heater 7 Gas Inlet — Element 7' },
  { ch: 8, tagCode: '7BG-AE-569', desc: 'Primary Air Heater 7 Gas Inlet — Element 8' }
];

var O2_INLET_COLOR_PAIRS = [
  ['#ab2121', '#ca7e72'], ['#9c691e', '#bea254'], ['#667917', '#78983a'], ['#246613', '#3e9338'],
  ['#1a8946', '#4ebc89'], ['#21abab', '#72beca'], ['#2158ab', '#728aca'], ['#3c21ab', '#9072ca']
];

O2_INLET_CHANNELS.forEach(function (c, idx) {
  var pair = O2_INLET_COLOR_PAIRS[idx % O2_INLET_COLOR_PAIRS.length];
  window.DCS_DEFAULT_TAGS.push({
    id: 'O2-INLET-CH' + c.ch,
    name: 'O2 Inlet Ch' + c.ch + ' (' + c.tagCode + ')',
    description: c.desc + ' — Before/After kalibrasi O2%, per kejadian PM mingguan',
    unit: '%',
    engineeringLow: 0, engineeringHigh: 25, min: 0, max: 25, chartMax: 25,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'PM_O2_WEEKLY_INLET', updateInterval: null,
    series: [
      { key: 'Before', label: 'Before Kalibrasi', color: pair[0] },
      { key: 'After',  label: 'After Kalibrasi',  color: pair[1] },
      { key: 'CellVoltage',     label: 'Cell Voltage (mV)',    color: '#3d5a70', defaultVisible: false },
      { key: 'CellTemperature', label: 'Cell Temperature (°C)', color: '#7a5730', defaultVisible: false },
      { key: 'CellLifetime',    label: 'Cell Lifetime (mo)',   color: '#5e4680', defaultVisible: false },
      { key: 'CellResistance',  label: 'Cell Resistance (Ω)',  color: '#33505c', defaultVisible: false }
    ]
  });
});
