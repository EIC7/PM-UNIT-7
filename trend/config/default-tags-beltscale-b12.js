/**
 * ==========================================================================
 * DEFAULT TAGS — Belt Conveyor B1-B2 (Belt Scale Calibration)
 * ==========================================================================
 * Sumber: beltscale-b12.html (modul Supabase 'BELT CONVEYOR B1-B2'). Lihat
 * js/adapters/beltscale-b12-adapter.js untuk detail struktur data mentahnya.
 *
 * 2026-08-30: dipecah dari 2 tag (A/B, tiap tag 11 series campur) jadi 4 tag
 * SEMPIT supaya bisa dikelompokkan jadi 3 tab trend terpisah lewat
 * config/modules/beltscale-b12.config.js ("Error Zero", "Beltscale A
 * Value", "Beltscale B Value"):
 *   - *-ERRORZERO: ZeroCalibration (Monthly, %) + ZeroError (3-Monthly, %)
 *   - *-VALUE: SpanError (%) + 8 series diagnostik 3-Monthly lain
 *     (satuan campuran PPM/Meter, skalanya beda jauh dari % -- defaultVisible
 *     false, tersedia lewat toggle TAG LIST + AUTO SCALE).
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

var BELTB12_POINTS = [
  { side: 'a', code: 'CCH-SCAL-100A', desc: 'Conveyor 100A' },
  { side: 'b', code: 'CCH-SCAL-100B', desc: 'Conveyor 100B' }
];

var BELTB12_COLORS = {
  a: { errorzero: '#1f6fb2', span: '#7a52a8' },
  b: { errorzero: '#c8342f', span: '#5e4680' }
};

BELTB12_POINTS.forEach(function (p) {
  var side = p.side;
  var colors = BELTB12_COLORS[side];

  window.DCS_DEFAULT_TAGS.push({
    id: 'BELTB12-' + side.toUpperCase() + '-ERRORZERO',
    name: 'Belt Scale ' + p.code + ' — Error Zero (' + p.desc + ')',
    description: 'Belt Scale Calibration ' + p.desc + ' — Error Zero Calibration (Monthly) & Zero Error (3-Monthly), %',
    unit: '%',
    engineeringLow: -5, engineeringHigh: 5, min: -5, max: 5, chartMax: 5,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR B1-B2', updateInterval: null,
    series: [
      { key: 'ZeroCalibration', label: 'Error Zero Calibration (%, Monthly)', color: colors.errorzero },
      { key: 'ZeroError',       label: 'Zero Error (%, 3 Monthly)',           color: side === 'a' ? '#17874a' : '#b5690a' }
    ]
  });

  window.DCS_DEFAULT_TAGS.push({
    id: 'BELTB12-' + side.toUpperCase() + '-VALUE',
    name: 'Belt Scale ' + p.code + ' — Value (' + p.desc + ')',
    description: 'Belt Scale Calibration ' + p.desc + ' — Span Error + Diagnostic Load/Pulse checks (3-Monthly)',
    unit: '%',
    engineeringLow: -5, engineeringHigh: 5, min: -5, max: 5, chartMax: 5,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR B1-B2', updateInterval: null,
    series: [
      { key: 'SpanError',         label: 'Span Error (%, 3 Monthly)',      color: colors.span },
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
