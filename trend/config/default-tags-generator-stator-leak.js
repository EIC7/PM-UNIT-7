/**
 * ==========================================================================
 * DEFAULT TAGS — Generator Stator Leak Monitoring
 * ==========================================================================
 * Sumber: generator_stator_leak_monitoring.html (modul Supabase
 * 'GENERATOR_STATOR_LEAK'). Lihat js/adapters/generator-stator-leak-adapter.js.
 *
 * 7 tag = 7 baris tetap di tabel "Measurement" form aslinya (Flow Rate,
 * Purge Air Flow, IA Pressure, Calibration Bottle Pressure, DO Probe Life,
 * H2 Reading, DO Reading) — BUKAN channel instrumen fisik seperti O2/SO2,
 * tapi parameter kalibrasi/kondisi sistem deteksi kebocoran stator generator.
 * Tiap parameter punya Before/After (kondisi sebelum & sesudah kalibrasi/
 * maintenance pada satu kejadian PM).
 *
 * ENGINEERING RANGE: ASUMSI berdasarkan rentang tipikal instrumen sejenis
 * (belum ada spesifikasi OEM eksplisit di form sumber) — sesuaikan kalau
 * ada data OEM aktual.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = window.DCS_DEFAULT_TAGS || [];

var GSL_PARAMS = [
  { id: 'GSL-FLOW-RATE',             name: 'Flow Rate',                  unit: 'L/min', low: 0, high: 50,  colors: ['#1a6b8a', '#5fa8c4'] },
  { id: 'GSL-PURGE-AIR-FLOW',        name: 'Purge Air Flow',             unit: 'L/min', low: 0, high: 50,  colors: ['#1a8a5e', '#5fc494'] },
  { id: 'GSL-IA-PRESSURE',           name: 'IA Pressure',                unit: 'bar',   low: 0, high: 10,  colors: ['#8a6b1a', '#c4a45f'] },
  { id: 'GSL-CAL-BOTTLE-PRESSURE',   name: 'Calibration Bottle Pressure', unit: 'bar',  low: 0, high: 200, colors: ['#8a1a3d', '#c45f83'] },
  { id: 'GSL-DO-PROBE-LIFE',         name: 'DO Probe Life',              unit: '%',     low: 0, high: 100, colors: ['#4a1a8a', '#8a5fc4'] },
  { id: 'GSL-H2-READING',            name: 'H2 Reading',                 unit: '%',     low: 0, high: 100, colors: ['#1a4a8a', '#5f83c4'] },
  { id: 'GSL-DO-READING',            name: 'DO Reading',                 unit: 'ppb',   low: 0, high: 50,  colors: ['#6b8a1a', '#a4c45f'] }
];

GSL_PARAMS.forEach(function (p) {
  window.DCS_DEFAULT_TAGS.push({
    id: p.id,
    name: p.name + ' (' + p.unit + ')',
    description: 'Generator Stator Leak Monitoring — ' + p.name + ', Before/After per kejadian PM.',
    unit: p.unit,
    engineeringLow: p.low, engineeringHigh: p.high, min: p.low, max: p.high, chartMax: p.high,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'GENERATOR_STATOR_LEAK', updateInterval: null,
    series: [
      { key: 'Before', label: 'Before', color: p.colors[0] },
      { key: 'After',  label: 'After',  color: p.colors[1] }
    ]
  });
});
