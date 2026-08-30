/**
 * ==========================================================================
 * DEFAULT TAGS — Belt Conveyor E2-E3 (Belt Scale Calibration)
 * ==========================================================================
 * Sumber: beltscale-e23.html (modul Supabase 'BELT CONVEYOR E2-E3'). Lihat
 * js/adapters/beltscale-e23-adapter.js untuk detail struktur data mentahnya.
 *
 * 2 sisi fisik = 2 tag: CCH-SCAL-200A (Conveyor 200A) & CCH-SCAL-200B
 * (Conveyor 200B). Series utama ZeroError/SpanError (3-Monthly Normal
 * Calibration, % -- pengecekan rutin tiap kunjungan PM) tercentang default.
 * 9 series lain (QuickZeroCheck dari BS_CHECKS + 8 item Defect Preventive
 * Maintenance/Initial Calibration -- PPM & Meter, biasanya cuma terisi
 * sekali saat setup awal bukan tiap PM rutin) defaultVisible:false, warna
 * tetap gelap/kontras (BUKAN pastel -- lihat catatan bug ui-manager.js
 * pakai warna series langsung sebagai warna teks di panel VALUES).
 *
 * ENGINEERING RANGE ZeroError/SpanError 0-2%: ASUMSI toleransi umum belt
 * scale calibration, sesuaikan kalau ada spesifikasi instrumen aktual.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = window.DCS_DEFAULT_TAGS || [];

var BSE23_SIDES = [
  { tagId: 'CCH-SCAL-200A', name: 'Conveyor 200A', desc: 'Belt Scale Conveyor E2-E3 sisi 200A' },
  { tagId: 'CCH-SCAL-200B', name: 'Conveyor 200B', desc: 'Belt Scale Conveyor E2-E3 sisi 200B' }
];

BSE23_SIDES.forEach(function (s) {
  window.DCS_DEFAULT_TAGS.push({
    id: s.tagId,
    name: s.name + ' (' + s.tagId + ')',
    description: s.desc + ' — kalibrasi 3-monthly & preventive maintenance',
    unit: '%',
    engineeringLow: -2, engineeringHigh: 2, min: -2, max: 2, chartMax: 2,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'BELT CONVEYOR E2-E3', updateInterval: null,
    series: [
      { key: 'ZeroError',         label: 'Zero Error (%)',              color: '#1f6fb2' },
      { key: 'SpanError',         label: 'Span Error (%)',              color: '#a3271f' },
      { key: 'QuickZeroCheck',    label: 'Error Zero Calibration (%)',  color: '#5e4680', defaultVisible: false },
      { key: 'LoadZero',          label: 'Load Zero (PPM)',             color: '#3d5a70', defaultVisible: false },
      { key: 'LoadSpan',          label: 'Load Span (PPM)',             color: '#7a5730', defaultVisible: false },
      { key: 'Pass1',             label: 'Pass 1 (Meter)',              color: '#33505c', defaultVisible: false },
      { key: 'Pass2',             label: 'Pass 2 (Meter)',              color: '#4a5c33', defaultVisible: false },
      { key: 'Pass3',             label: 'Pass 3 (Meter)',              color: '#5c3350', defaultVisible: false },
      { key: 'AvgPulseLength',    label: 'Avg Pulse/Length (PPM)',      color: '#705a3d', defaultVisible: false },
      { key: 'ZeroCheckUnloaded', label: 'Zero Check Unloaded (PPM)',   color: '#3d4a70', defaultVisible: false },
      { key: 'TestLoadCheck',     label: 'Test Load Check (PPM)',       color: '#70503d', defaultVisible: false }
    ]
  });
});
