/**
 * ==========================================================================
 * KONFIGURASI MODUL: Belt Conveyor E4-E5
 * ==========================================================================
 * deviationPairs: New vs Old Zero Change Value dipakai sebagai "pergeseran
 * zero" antar kalibrasi (pola sama dengan beforeVsAfter di so2.config.js),
 * berlaku sama untuk kedua tag (A=Conveyor E-4, B=Conveyor E-5) karena
 * module-view.js menerapkan deviationPairs generik per-tag yang tercentang.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['BELT CONVEYOR E4-E5'] = {
  key: 'BELT CONVEYOR E4-E5',
  tabLabel: 'Belt Conveyor E4-E5',
  tabOrder: 16,
  adapterKey: 'BELT CONVEYOR E4-E5',
  tagIds: ['BELTSCALE-E45-A', 'BELTSCALE-E45-B'],

  deviationPairs: [
    {
      key: 'zeroChangeDrift',
      label: 'Pergeseran Zero (New − Old)',
      seriesA: 'NewZeroChange',
      seriesB: 'OldZeroChange',
      toleranceValue: null,
      unit: '',
      description: 'Selisih nilai zero change antar kalibrasi — tren menjauh dari 0 mengindikasikan drift belt scale yang makin sering.'
    }
  ],

  kpis: [
    { key: 'lastErrorZeroCal', label: 'Error Zero Terakhir',  source: 'lastValue', series: 'ErrorZeroCal' },
    { key: 'lastNewZero',      label: 'New Zero Terakhir',    source: 'lastValue', series: 'NewZeroChange' },
    { key: 'lastDrift',        label: 'Pergeseran Terakhir',  source: 'lastDeviation', pair: 'zeroChangeDrift' },
    { key: 'daysSinceCal',     label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',           label: 'Tanggal' },
    { key: 'pic',            label: 'Teknisi' },
    { key: 'ErrorZeroCal',   label: 'Error Zero (%)' },
    { key: 'NewZeroChange',  label: 'New Zero' },
    { key: 'OldZeroChange',  label: 'Old Zero' },
    { key: 'recordId',       label: 'Record' }
  ]
};
