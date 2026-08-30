/**
 * ==========================================================================
 * KONFIGURASI MODUL: Belt Conveyor B1-B2 (Belt Scale Calibration)
 * ==========================================================================
 * Semua bacaan (Monthly Zero Calibration, 3-Monthly Diagnostic Load/Pulse/
 * Zero-Span Error) adalah nilai INDEPENDEN -- tidak ada pasangan before/
 * after atau actual/expected alami di sumber datanya, jadi deviationPairs
 * sengaja dikosongkan (module-view.js aman menangani array kosong ini).
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var BELTB12_TAG_IDS = ['BELTB12-A', 'BELTB12-B'];

window.DCS_MODULES['BELT CONVEYOR B1-B2'] = {
  key: 'BELT CONVEYOR B1-B2',
  tabLabel: 'Belt Conveyor B1-B2',
  tabOrder: 14,
  adapterKey: 'BELT CONVEYOR B1-B2',
  tagIds: BELTB12_TAG_IDS,

  deviationPairs: [],

  kpis: [
    { key: 'lastZeroCal',   label: 'Zero Calibration Terakhir', source: 'lastValue', series: 'ZeroCalibration' },
    { key: 'lastZeroError', label: 'Zero Error Terakhir',       source: 'lastValue', series: 'ZeroError' },
    { key: 'lastSpanError', label: 'Span Error Terakhir',       source: 'lastValue', series: 'SpanError' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi',      source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',              label: 'Tanggal' },
    { key: 'pic',                label: 'Teknisi' },
    { key: 'ZeroCalibration',    label: 'Zero Calibration (%)' },
    { key: 'ZeroError',          label: 'Zero Error (%)' },
    { key: 'SpanError',          label: 'Span Error (%)' },
    { key: 'DiagLoadZero',       label: 'Diag Load Zero (PPM)' },
    { key: 'DiagLoadSpan',       label: 'Diag Load Span (PPM)' },
    { key: 'recordId',           label: 'Record' }
  ]
};
