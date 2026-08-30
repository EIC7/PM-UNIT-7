/**
 * ==========================================================================
 * KONFIGURASI MODUL: Belt Conveyor E4-E5 — 3 TAB TERPISAH
 * ==========================================================================
 * 2026-08-30: dipecah dari 1 module ('BELT CONVEYOR E4-E5', 2 tag A/B
 * campur 3 series) jadi 3 DCS_MODULES entry terpisah -- SATU adapter yang
 * sama (adapterKey tetap 'BELT CONVEYOR E4-E5', 1 fetch Supabase dipakai
 * bareng) tapi tiap entry cuma nunjuk ke subset tagIds-nya sendiri, jadi
 * module-view.js merender 3 TAB terpisah di module-tab-bar (pola sama
 * dengan FEGT+LD berbagi 1 adapter -- lihat fegt.config.js/ld.config.js):
 *   1. "Error Zero"          -- ErrorZeroCal, sisi A & B digabung 1 tab
 *   2. "Beltscale A Value"   -- New/Old Zero Change Value, Conveyor E-4 saja
 *   3. "Beltscale B Value"   -- New/Old Zero Change Value, Conveyor E-5 saja
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['BELT_E45_ERRORZERO'] = {
  key: 'BELT_E45_ERRORZERO',
  tabLabel: 'Error Zero',
  tabOrder: 16,
  adapterKey: 'BELT CONVEYOR E4-E5',
  tagIds: ['BELTSCALE-E45-A-ERRORZERO', 'BELTSCALE-E45-B-ERRORZERO'],

  deviationPairs: [],

  kpis: [
    { key: 'lastErrorZeroCal', label: 'Error Zero Terakhir',  source: 'lastValue', series: 'ErrorZeroCal' },
    { key: 'daysSinceCal',     label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',         label: 'Tanggal' },
    { key: 'pic',          label: 'Teknisi' },
    { key: 'ErrorZeroCal', label: 'Error Zero (%)' },
    { key: 'recordId',     label: 'Record' }
  ]
};

window.DCS_MODULES['BELT_E45_A_VALUE'] = {
  key: 'BELT_E45_A_VALUE',
  tabLabel: 'Beltscale A Value',
  tabOrder: 17,
  adapterKey: 'BELT CONVEYOR E4-E5',
  tagIds: ['BELTSCALE-E45-A-VALUE'],

  deviationPairs: [
    {
      key: 'zeroChangeDriftA',
      label: 'Pergeseran Zero (New − Old), Conveyor E-4',
      seriesA: 'NewZeroChange',
      seriesB: 'OldZeroChange',
      toleranceValue: null,
      unit: '',
      description: 'Selisih nilai zero change antar kalibrasi Conveyor E-4 — tren menjauh dari 0 mengindikasikan drift belt scale yang makin sering.'
    }
  ],

  kpis: [
    { key: 'lastNewZero', label: 'New Zero Terakhir',   source: 'lastValue', series: 'NewZeroChange' },
    { key: 'lastOldZero', label: 'Old Zero Terakhir',   source: 'lastValue', series: 'OldZeroChange' },
    { key: 'lastDrift',   label: 'Pergeseran Terakhir', source: 'lastDeviation', pair: 'zeroChangeDriftA' },
    { key: 'daysSinceCal', label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',           label: 'Tanggal' },
    { key: 'pic',            label: 'Teknisi' },
    { key: 'NewZeroChange',  label: 'New Zero' },
    { key: 'OldZeroChange',  label: 'Old Zero' },
    { key: 'recordId',       label: 'Record' }
  ]
};

window.DCS_MODULES['BELT_E45_B_VALUE'] = {
  key: 'BELT_E45_B_VALUE',
  tabLabel: 'Beltscale B Value',
  tabOrder: 18,
  adapterKey: 'BELT CONVEYOR E4-E5',
  tagIds: ['BELTSCALE-E45-B-VALUE'],

  deviationPairs: [
    {
      key: 'zeroChangeDriftB',
      label: 'Pergeseran Zero (New − Old), Conveyor E-5',
      seriesA: 'NewZeroChange',
      seriesB: 'OldZeroChange',
      toleranceValue: null,
      unit: '',
      description: 'Selisih nilai zero change antar kalibrasi Conveyor E-5 — tren menjauh dari 0 mengindikasikan drift belt scale yang makin sering.'
    }
  ],

  kpis: [
    { key: 'lastNewZero', label: 'New Zero Terakhir',   source: 'lastValue', series: 'NewZeroChange' },
    { key: 'lastOldZero', label: 'Old Zero Terakhir',   source: 'lastValue', series: 'OldZeroChange' },
    { key: 'lastDrift',   label: 'Pergeseran Terakhir', source: 'lastDeviation', pair: 'zeroChangeDriftB' },
    { key: 'daysSinceCal', label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',           label: 'Tanggal' },
    { key: 'pic',            label: 'Teknisi' },
    { key: 'NewZeroChange',  label: 'New Zero' },
    { key: 'OldZeroChange',  label: 'Old Zero' },
    { key: 'recordId',       label: 'Record' }
  ]
};
