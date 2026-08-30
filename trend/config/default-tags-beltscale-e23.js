/**
 * ==========================================================================
 * DEFAULT TAGS — Belt Conveyor E2-E3 (Belt Scale Calibration)
 * ==========================================================================
 * Sumber: beltscale-e23.html (modul Supabase 'BELT CONVEYOR E2-E3'). Lihat
 * js/adapters/beltscale-e23-adapter.js untuk detail struktur data mentahnya.
 *
 * 2026-08-30: dipecah dari 2 tag (A/B, tiap tag 11 series campur) jadi 4 tag
 * SEMPIT supaya bisa dikelompokkan jadi 3 tab trend terpisah lewat
 * config/modules/beltscale-e23.config.js ("Error Zero", "Beltscale A
 * Value", "Beltscale B Value"):
 *   - *-ERRORZERO: ZeroError (3-Monthly, %) + QuickZeroCheck (label "Error
 *     Zero Calibration (%)", ekuivalen ZeroCalibration di modul B1-B2)
 *   - *-VALUE: SpanError (%) + 8 series diagnostik 3-Monthly lain (satuan
 *     campuran PPM/Meter, biasanya cuma terisi sekali saat setup awal --
 *     defaultVisible false, tersedia lewat toggle TAG LIST + AUTO SCALE).
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = window.DCS_DEFAULT_TAGS || [];

var BSE23_SIDES = [
  { side: 'a', tagCode: 'CCH-SCAL-200A', name: 'Conveyor 200A' },
  { side: 'b', tagCode: 'CCH-SCAL-200B', name: 'Conveyor 200B' }
];

var BSE23_COLORS = {
  a: { errorzero: '#1f6fb2', span: '#a3271f' },
  b: { errorzero: '#17874a', span: '#b5690a' }
};

BSE23_SIDES.forEach(function (s) {
  var colors = BSE23_COLORS[s.side];

  window.DCS_DEFAULT_TAGS.push({
    id: s.tagCode + '-ERRORZERO',
    name: s.name + ' — Error Zero (' + s.tagCode + ')',
    description: 'Belt Scale Conveyor E2-E3 sisi ' + s.name + ' — Zero Error (3-Monthly) & Error Zero Calibration, %',
    unit: '%',
    engineeringLow: -2, engineeringHigh: 2, min: -2, max: 2, chartMax: 2,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E2-E3', updateInterval: null,
    series: [
      { key: 'ZeroError',      label: 'Zero Error (%)',             color: colors.errorzero },
      { key: 'QuickZeroCheck', label: 'Error Zero Calibration (%)', color: '#5e4680' }
    ]
  });

  window.DCS_DEFAULT_TAGS.push({
    id: s.tagCode + '-VALUE',
    name: s.name + ' — Value (' + s.tagCode + ')',
    description: 'Belt Scale Conveyor E2-E3 sisi ' + s.name + ' — Span Error + preventive maintenance/initial calibration checks',
    unit: '%',
    engineeringLow: -2, engineeringHigh: 2, min: -2, max: 2, chartMax: 2,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E2-E3', updateInterval: null,
    series: [
      { key: 'SpanError',         label: 'Span Error (%)',            color: colors.span },
      { key: 'LoadZero',          label: 'Load Zero (PPM)',           color: '#3d5a70', defaultVisible: false },
      { key: 'LoadSpan',          label: 'Load Span (PPM)',           color: '#7a5730', defaultVisible: false },
      { key: 'Pass1',             label: 'Pass 1 (Meter)',            color: '#33505c', defaultVisible: false },
      { key: 'Pass2',             label: 'Pass 2 (Meter)',            color: '#4a5c33', defaultVisible: false },
      { key: 'Pass3',             label: 'Pass 3 (Meter)',            color: '#5c3350', defaultVisible: false },
      { key: 'AvgPulseLength',    label: 'Avg Pulse/Length (PPM)',    color: '#705a3d', defaultVisible: false },
      { key: 'ZeroCheckUnloaded', label: 'Zero Check Unloaded (PPM)', color: '#3d4a70', defaultVisible: false },
      { key: 'TestLoadCheck',     label: 'Test Load Check (PPM)',     color: '#70503d', defaultVisible: false }
    ]
  });
});
