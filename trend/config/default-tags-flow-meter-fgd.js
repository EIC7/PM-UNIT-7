/**
 * ==========================================================================
 * DEFAULT TAGS — Flow Meter FGD Inlet & Quencher
 * ==========================================================================
 * Sumber: flow-meter-fgd.html (modul Supabase
 * 'Flow Meter FGD Inlet & Quencher'). Lihat
 * js/adapters/flow-meter-fgd-adapter.js untuk detail struktur data mentahnya.
 *
 * 4 flow transmitter = 4 tag (FM_ASSETS di flow-meter-fgd.html). Series
 * utama Before/After (pembacaan flow m3/Hr sebelum/sesudah cleaning &
 * correction, PM 1 Yearly Inspection & Cleaning) tercentang default —
 * dipakai panel deviasi "Koreksi Flow" (pola persis beforeVsAfter di
 * so2.config.js / o2-inlet.config.js). Series InsertionFactor/ProfileFactor
 * (parameter kalibrasi yang TIDAK locked di form asalnya, bisa berubah
 * antar PM cycle) ikut terdaftar tapi defaultVisible:false.
 *
 * ENGINEERING RANGE 0-12000 m3/h: mengikuti Qmax terbesar di antara 4 asset
 * (FT-103/FT-203 Qmax 10000, FT-101/FT-201 Qmax 1000) plus margin — ASUMSI,
 * sesuaikan kalau perlu skala per-tag yang lebih presisi.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = window.DCS_DEFAULT_TAGS || [];

var FM_TREND_ASSETS = [
  { key: '101', tagCode: '7FC-FT-101', desc: 'FGD-A Quencher Spray Water Flow Transmitter', qmax: 1000 },
  { key: '103', tagCode: '7FC-FT-103', desc: 'FGD-A Inlet Spray Water Flow Transmitter', qmax: 10000 },
  { key: '201', tagCode: '7FC-FT-201', desc: 'FGD-B Quencher Spray Water Flow Transmitter', qmax: 1000 },
  { key: '203', tagCode: '7FC-FT-203', desc: 'FGD-B Inlet Spray Water Flow Transmitter', qmax: 10000 }
];

var FM_TREND_COLOR_PAIRS = [
  ['#ab2121', '#ca7e72'], ['#1f6fb2', '#7ea8ca'], ['#1a8946', '#4ebc89'], ['#9c691e', '#bea254']
];

FM_TREND_ASSETS.forEach(function (a, idx) {
  var pair = FM_TREND_COLOR_PAIRS[idx % FM_TREND_COLOR_PAIRS.length];
  var chartMax = Math.round(a.qmax * 1.2);
  window.DCS_DEFAULT_TAGS.push({
    id: 'FM-' + a.key,
    name: 'Flow Meter ' + a.tagCode,
    description: a.desc + ' — pembacaan flow Before/After cleaning & correction, per kejadian PM',
    unit: 'm3/Hr',
    engineeringLow: 0, engineeringHigh: a.qmax, min: 0, max: a.qmax, chartMax: chartMax,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'Flow Meter FGD', updateInterval: null,
    series: [
      { key: 'Before', label: 'Before Cleaning (m3/Hr)', color: pair[0] },
      { key: 'After',  label: 'After Cleaning (m3/Hr)',  color: pair[1] },
      { key: 'InsertionFactor', label: 'Insertion Factor', color: '#4a5f70', defaultVisible: false },
      { key: 'ProfileFactor',   label: 'Profile Factor',   color: '#6b4a2f', defaultVisible: false }
    ]
  });
});
