/**
 * ==========================================================================
 * DEFAULT TAGS — Belt Conveyor E4-E5
 * ==========================================================================
 * Sumber: beltscale-e45.html (modul Supabase 'BELT CONVEYOR E4-E5'). Lihat
 * js/adapters/beltscale-e45-adapter.js untuk detail struktur data mentahnya.
 *
 * 2 tag = 2 conveyor fisik (Panel E4 / Panel E5), masing-masing 3 series
 * dari 3 field numerik satu-satunya di checksheet ini (Error Zero
 * Calibration %, New/Old Zero Change Value — sisanya di form murni
 * checkbox PTW/cleaning/dst, tidak ada data numerik lain untuk di-trend).
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

window.DCS_DEFAULT_TAGS.push({
  id: 'BELTSCALE-E45-A',
  name: 'Conveyor E-4 (CCH-SCAL-800A)',
  description: 'Belt Scale Conveyor E-4, Panel E4 — kalibrasi zero berkala',
  unit: '%',
  engineeringLow: -1, engineeringHigh: 1, min: -1, max: 1, chartMax: 1,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E4-E5', updateInterval: null,
  series: [
    { key: 'ErrorZeroCal',   label: 'Error Zero Calibration (%)', color: '#1f6fb2' },
    { key: 'NewZeroChange',  label: 'New Zero Change Value',      color: '#c8342f', defaultVisible: false },
    { key: 'OldZeroChange',  label: 'Old Zero Change Value',      color: '#7a5730', defaultVisible: false }
  ]
});

window.DCS_DEFAULT_TAGS.push({
  id: 'BELTSCALE-E45-B',
  name: 'Conveyor E-5 (CCH-SCAL-800B)',
  description: 'Belt Scale Conveyor E-5, Panel E5 — kalibrasi zero berkala',
  unit: '%',
  engineeringLow: -1, engineeringHigh: 1, min: -1, max: 1, chartMax: 1,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E4-E5', updateInterval: null,
  series: [
    { key: 'ErrorZeroCal',   label: 'Error Zero Calibration (%)', color: '#17874a' },
    { key: 'NewZeroChange',  label: 'New Zero Change Value',      color: '#b5690a', defaultVisible: false },
    { key: 'OldZeroChange',  label: 'Old Zero Change Value',      color: '#5e4680', defaultVisible: false }
  ]
});
