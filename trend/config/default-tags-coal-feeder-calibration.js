/**
 * ==========================================================================
 * DEFAULT TAGS — Coal Feeder Calibration
 * ==========================================================================
 * Sumber: coal_feeder_calibration.html. Lihat
 * js/adapters/coal-feeder-calibration-adapter.js untuk detail struktur data
 * mentahnya & cara huruf feeder (A-F) ditarik dari teks modul.
 *
 * 2026-08-30: dulu SATU tag agregat ('COAL-FEEDER-CAL') karena Feeder No.
 * masih input teks bebas. Sekarang field itu jadi dropdown TETAP 6 feeder
 * (7BF-PVR-500A..F / PULVERIZER 7A..F), jadi di-split jadi 6 tag terpisah
 * (COAL-FEEDER-A..F) -- pola sama dengan modul multi-channel lain (O2 dkk).
 * Series per tag:
 *   - Cal1DeviationAvg / Cal2DeviationAvg: rata-rata deviasi dari 2 metode
 *     uji kalibrasi (3 titik ulangan masing-masing, dirata-ratakan).
 *   - Demand100FlowRate: "Actual Feed Rate on Display (t/h)" pada demand
 *     test 100% -- hasil verifikasi kalibrasi paling representatif.
 * Acceptance kalibrasi form aslinya ±0.25% (lihat CF_CAL1_ROWS/CF_CAL2_ROWS
 * di coal_feeder_calibration.html) -- dipakai sebagai konteks engineering
 * range di bawah, bukan alarm formal.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = window.DCS_DEFAULT_TAGS || [];

var COAL_FEEDER_UNITS = [
  { letter: 'A', tagCode: '7BF-PVR-500A', desc: 'Pulverizer 7A' },
  { letter: 'B', tagCode: '7BF-PVR-500B', desc: 'Pulverizer 7B' },
  { letter: 'C', tagCode: '7BF-PVR-500C', desc: 'Pulverizer 7C' },
  { letter: 'D', tagCode: '7BF-PVR-500D', desc: 'Pulverizer 7D' },
  { letter: 'E', tagCode: '7BF-PVR-500E', desc: 'Pulverizer 7E' },
  { letter: 'F', tagCode: '7BF-PVR-500F', desc: 'Pulverizer 7F' }
];

var COAL_FEEDER_COLOR_PAIRS = [
  ['#3d3d8a', '#8a5a1f'], ['#1f6b5a', '#8a1f4a'], ['#6b3d8a', '#1f5c8a'],
  ['#8a5a1f', '#3d3d8a'], ['#a31e3f', '#1f8a7a'], ['#2f7a3d', '#7a8a1f']
];

COAL_FEEDER_UNITS.forEach(function (u, idx) {
  var pair = COAL_FEEDER_COLOR_PAIRS[idx % COAL_FEEDER_COLOR_PAIRS.length];
  window.DCS_DEFAULT_TAGS.push({
    id: 'COAL-FEEDER-' + u.letter,
    name: 'Coal Feeder ' + u.letter + ' (' + u.tagCode + ')',
    description: u.desc + ' — deviasi kalibrasi (2 metode uji, acceptance ±0.25%) + hasil demand test 100% beban, per kejadian PM',
    unit: '%',
    engineeringLow: -1, engineeringHigh: 1, min: -2, max: 2, chartMax: 2,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'Feeder Calibration', updateInterval: null,
    series: [
      { key: 'Cal1DeviationAvg',  label: 'Deviasi Kalibrasi 1 (avg, %)', color: pair[0] },
      { key: 'Cal2DeviationAvg',  label: 'Deviasi Kalibrasi 2 (avg, %)', color: pair[1] },
      { key: 'Demand100FlowRate', label: 'Feed Rate @ Demand 100% (t/h)', color: '#33505c', defaultVisible: false }
    ]
  });
});
