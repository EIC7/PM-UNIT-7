/**
 * ==========================================================================
 * DEFAULT TAGS — Belt Conveyor B1-B2 (Belt Scale Calibration)
 * ==========================================================================
 * Sumber: beltscale-b12.html (modul Supabase 'BELT CONVEYOR B1-B2'). Lihat
 * js/adapters/beltscale-b12-adapter.js untuk detail struktur data mentahnya.
 *
 * 2 titik ukur = 2 tag (A = CCH-SCAL-100A/Conveyor 100A, B = CCH-SCAL-100B/
 * Conveyor 100B). Series utama ZeroCalibration/ZeroError/SpanError (%)
 * tercentang default -- ini indikator kesehatan kalibrasi paling langsung
 * dibaca. Series 3-Monthly lain (DiagLoad, Pulse, ZeroCheckUnloaded,
 * TestLoadCheck) satuannya campuran (PPM/Meter) dan skalanya beda jauh dari
 * %, jadi defaultVisible:false -- tersedia lewat toggle TAG LIST kalau
 * perlu, pakai AUTO SCALE waktu diaktifkan biar sumbu-Y menyesuaikan.
 *
 * ENGINEERING RANGE -5..5 (%): ASUMSI berdasar placeholder form asli
 * ("e.g. 0.01%") -- sesuaikan kalau ada spesifikasi toleransi resmi.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

var BELTB12_POINTS = [
  { id: 'BELTB12-A', code: 'CCH-SCAL-100A', desc: 'Conveyor 100A' },
  { id: 'BELTB12-B', code: 'CCH-SCAL-100B', desc: 'Conveyor 100B' }
];

var BELTB12_COLORS = { a: '#1f6fb2', b: '#c8342f' };

BELTB12_POINTS.forEach(function (p, idx) {
  var side = idx === 0 ? 'a' : 'b';
  var color = BELTB12_COLORS[side];
  window.DCS_DEFAULT_TAGS.push({
    id: p.id,
    name: 'Belt Scale ' + p.code + ' (' + p.desc + ')',
    description: 'Belt Scale Calibration ' + p.desc + ' — Monthly Zero Calibration + 3 Monthly Diagnostic/Pulse checks',
    unit: '%',
    engineeringLow: -5, engineeringHigh: 5, min: -5, max: 5, chartMax: 5,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR B1-B2', updateInterval: null,
    series: [
      { key: 'ZeroCalibration', label: 'Error Zero Calibration (%, Monthly)', color: color },
      { key: 'ZeroError',       label: 'Zero Error (%, 3 Monthly)',           color: idx === 0 ? '#17874a' : '#b5690a' },
      { key: 'SpanError',       label: 'Span Error (%, 3 Monthly)',           color: idx === 0 ? '#7a52a8' : '#5e4680' },
      { key: 'DiagLoadZero',      label: 'Diagnostic Load Zero dA1 (PPM)', color: '#3d5a70', defaultVisible: false },
      { key: 'DiagLoadSpan',      label: 'Diagnostic Load Span dA1 (PPM)', color: '#33505c', defaultVisible: false },
      { key: 'PulsePass1',        label: 'Pulse/Length Pass 1 (Meter)',    color: '#7a5730', defaultVisible: false },
      { key: 'PulsePass2',        label: 'Pulse/Length Pass 2 (Meter)',    color: '#6b4a26', defaultVisible: false },
      { key: 'PulsePass3',        label: 'Pulse/Length Pass 3 (Meter)',    color: '#5c3d1e', defaultVisible: false },
      { key: 'PulsePerMeter',     label: 'Average Pulse/Meter (PPM)',      color: '#5e4680', defaultVisible: false },
      { key: 'ZeroCheckUnloaded', label: 'Zero Check Unloaded (PPM)',      color: '#3d5a70', defaultVisible: false },
      { key: 'TestLoadCheck',     label: 'Test Load Check (PPM)',          color: '#33505c', defaultVisible: false }
    ]
  });
});
