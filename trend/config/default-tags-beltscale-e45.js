/**
 * ==========================================================================
 * DEFAULT TAGS — Belt Conveyor E4-E5
 * ==========================================================================
 * Sumber: beltscale-e45.html (modul Supabase 'BELT CONVEYOR E4-E5'). Lihat
 * js/adapters/beltscale-e45-adapter.js untuk detail struktur data mentahnya.
 *
 * 2026-08-30: dipecah dari 2 tag (A/B, tiap tag 3 series campur) jadi 4 tag
 * SEMPIT supaya bisa dikelompokkan jadi 3 tab trend terpisah lewat
 * config/modules/beltscale-e45.config.js ("Error Zero", "Beltscale A
 * Value", "Beltscale B Value") — permintaan user, 1 tag = 1 series-group
 * per tab supaya TAG LIST tiap tab cuma nampilin yang relevan, bukan
 * campur semua 3 series sekaligus.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [];

window.DCS_DEFAULT_TAGS.push({
  id: 'BELTSCALE-E45-A-ERRORZERO',
  name: 'Conveyor E-4 — Error Zero (CCH-SCAL-800A)',
  description: 'Belt Scale Conveyor E-4, Panel E4 — Error Zero Calibration (%)',
  unit: '%',
  engineeringLow: -1, engineeringHigh: 1, min: -1, max: 1, chartMax: 1,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E4-E5', updateInterval: null,
  series: [
    { key: 'ErrorZeroCal', label: 'Error Zero Calibration (%)', color: '#1f6fb2' }
  ]
});

window.DCS_DEFAULT_TAGS.push({
  id: 'BELTSCALE-E45-B-ERRORZERO',
  name: 'Conveyor E-5 — Error Zero (CCH-SCAL-800B)',
  description: 'Belt Scale Conveyor E-5, Panel E5 — Error Zero Calibration (%)',
  unit: '%',
  engineeringLow: -1, engineeringHigh: 1, min: -1, max: 1, chartMax: 1,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E4-E5', updateInterval: null,
  series: [
    { key: 'ErrorZeroCal', label: 'Error Zero Calibration (%)', color: '#17874a' }
  ]
});

window.DCS_DEFAULT_TAGS.push({
  id: 'BELTSCALE-E45-A-VALUE',
  name: 'Conveyor E-4 — Zero Value (CCH-SCAL-800A)',
  description: 'Belt Scale Conveyor E-4, Panel E4 — New/Old Zero Change Value',
  unit: '',
  // Nilai counter mentah (contoh placeholder form asli: "e.g. 966048") --
  // TIDAK ada rentang engineering yang bermakna secara fisik, rentang di
  // bawah cuma batas awal wajar sebelum user pakai AUTO SCALE.
  engineeringLow: 0, engineeringHigh: 2000000, min: 0, max: 2000000, chartMax: 2000000,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E4-E5', updateInterval: null,
  series: [
    { key: 'NewZeroChange', label: 'New Zero Change Value', color: '#c8342f' },
    { key: 'OldZeroChange', label: 'Old Zero Change Value', color: '#7a5730' }
  ]
});

window.DCS_DEFAULT_TAGS.push({
  id: 'BELTSCALE-E45-B-VALUE',
  name: 'Conveyor E-5 — Zero Value (CCH-SCAL-800B)',
  description: 'Belt Scale Conveyor E-5, Panel E5 — New/Old Zero Change Value',
  unit: '',
  // Nilai counter mentah (contoh placeholder form asli: "e.g. 966048") --
  // TIDAK ada rentang engineering yang bermakna secara fisik, rentang di
  // bawah cuma batas awal wajar sebelum user pakai AUTO SCALE.
  engineeringLow: 0, engineeringHigh: 2000000, min: 0, max: 2000000, chartMax: 2000000,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true, enabled: true,
  source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E4-E5', updateInterval: null,
  series: [
    { key: 'NewZeroChange', label: 'New Zero Change Value', color: '#b5690a' },
    { key: 'OldZeroChange', label: 'Old Zero Change Value', color: '#5e4680' }
  ]
});
