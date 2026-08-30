/**
 * ==========================================================================
 * DEFAULT TAGS — Analyzer Indicator Transmitter (pH)
 * ==========================================================================
 * Sumber: ph-analyzer.html (modul Supabase 'Analyzer Indicator Transmitter
 * (pH)'). 6 unit CWT-AIT = 6 tag (1 per instrumen fisik). Series utama
 * DCSPH vs LocalPH (pembacaan DCS vs verifikasi lapangan, pola sama dengan
 * DCS/Local di SO2) tercentang default — dipakai panel deviasi "DCS vs
 * Local". Series sekunder (mAmp Local/DCS, Slope, Offset, Temperature, 3
 * pembacaan Buffer verifikasi 4/7/10) ikut terdaftar tapi defaultVisible:
 * false (lihat js/adapters/ph-analyzer-adapter.js untuk struktur data
 * mentahnya).
 *
 * ENGINEERING RANGE 0-14 pH (skala pH baku) untuk SEMUA series di tag ini
 * meski sebagian series (mAmp) satuannya beda (4-20mA) — sama pola dengan
 * O2 Weekly yang menaruh series kesehatan cell dengan satuan campuran di
 * bawah 1 tag/rentang yang sama, chart tetap menampilkan nilai apa adanya.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

var PH_UNITS_TREND = [
  { id: 'CWT-AIT-502', desc: 'WWT Aeration Tank Header — Analyzer Indicator Transmitter' },
  { id: 'CWT-AIT-503', desc: 'WWT Aeration Tank Header — Analyzer Indicator Transmitter' },
  { id: 'CWT-AIT-507', desc: 'WWT Aeration Tank Air Outlet — PH Analyzer Indicator Transmitter' },
  { id: 'CWT-AIT-512', desc: 'WWT PH Trim Tank Mixer Header — Analyzer Indicator Transmitter' },
  { id: 'CWT-AIT-513', desc: 'WWT PH Transmitter Outlet — PH Trim Tank Analyzer (CWT-TK-930)' },
  { id: 'CWT-AIT-936', desc: 'WWT System Supply Pump C — Analytical Indicating Transmitter' }
];

var PH_COLOR_PAIRS = [
  ['#1f6fb2', '#e07b12'], ['#1c8a4c', '#c8342f'], ['#7a52a8', '#c96aa3'],
  ['#21abab', '#b5690a'], ['#2158ab', '#8a5a3e'], ['#246613', '#ab2121']
];

PH_UNITS_TREND.forEach(function (u, idx) {
  var pair = PH_COLOR_PAIRS[idx % PH_COLOR_PAIRS.length];
  window.DCS_DEFAULT_TAGS.push({
    id: 'PH-' + u.id,
    name: u.id,
    description: u.desc + ' — pembacaan DCS vs Local (pH), per kejadian PM',
    unit: 'pH',
    engineeringLow: 0, engineeringHigh: 14, min: 0, max: 14, chartMax: 14,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'Analyzer Indicator Transmitter (pH)', updateInterval: null,
    series: [
      { key: 'DCSPH',   label: 'DCS Reading (pH)',   color: pair[0] },
      { key: 'LocalPH', label: 'Local Reading (pH)', color: pair[1] },
      { key: 'DCSMA',           label: 'mAmp DCS',            color: '#3d5a70', defaultVisible: false },
      { key: 'LocalMA',         label: 'mAmp Local',          color: '#7a5730', defaultVisible: false },
      { key: 'Slope',           label: 'Slope',                color: '#5e4680', defaultVisible: false },
      { key: 'Offset',          label: 'Offset',               color: '#33505c', defaultVisible: false },
      { key: 'Temperature',     label: 'Temperature (°C)',     color: '#6b3d3d', defaultVisible: false },
      { key: 'Buffer1Reading',  label: 'Buffer 1 (target pH 4)',  color: '#4a5a2e', defaultVisible: false },
      { key: 'Buffer2Reading',  label: 'Buffer 2 (target pH 7)',  color: '#2e5a4a', defaultVisible: false },
      { key: 'Buffer3Reading',  label: 'Buffer 3 (target pH 10)', color: '#5a2e4a', defaultVisible: false }
    ]
  });
});
