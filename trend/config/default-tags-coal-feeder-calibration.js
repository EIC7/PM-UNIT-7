/**
 * ==========================================================================
 * DEFAULT TAGS — Coal Feeder Calibration
 * ==========================================================================
 * Sumber: coal_feeder_calibration.html (modul Supabase
 * 'Coal Feeder Calibration'). Lihat js/adapters/coal-feeder-calibration-
 * adapter.js untuk detail struktur data mentahnya.
 *
 * SATU tag agregat ('COAL-FEEDER-CAL') -- checksheet ini tidak punya daftar
 * feeder tetap (feeder_no diisi bebas per submission), beda dari modul
 * multi-channel lain (O2/SO2) yang punya kanal fisik tetap. Series:
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

window.DCS_DEFAULT_TAGS.push({
  id: 'COAL-FEEDER-CAL',
  name: 'COAL FEEDER CALIBRATION',
  description: 'Deviasi kalibrasi feeder (2 metode uji, acceptance ±0.25%) + hasil demand test 100% beban, per kejadian PM',
  unit: '%',
  engineeringLow: -1, engineeringHigh: 1, min: -2, max: 2, chartMax: 2,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'Coal Feeder Calibration', updateInterval: null,
  series: [
    { key: 'Cal1DeviationAvg',   label: 'Deviasi Kalibrasi 1 (avg, %)', color: '#3d3d8a' },
    { key: 'Cal2DeviationAvg',   label: 'Deviasi Kalibrasi 2 (avg, %)', color: '#8a5a1f' },
    { key: 'Demand100FlowRate',  label: 'Feed Rate @ Demand 100% (t/h)', color: '#1f6b5a', defaultVisible: false }
  ]
});
