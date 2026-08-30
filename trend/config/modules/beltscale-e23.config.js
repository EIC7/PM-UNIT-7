/**
 * ==========================================================================
 * KONFIGURASI MODUL: Belt Conveyor E2-E3 (Belt Scale Calibration)
 * ==========================================================================
 * BEDA dari O2/SO2/CEMS: tidak ada before/after kalibrasi natural antar tag
 * (2 tag = 2 conveyor independen, bukan pasangan sebelum/sesudah). deviationPairs
 * sengaja dikosongkan, sama pola dengan o2-outlet.config.js -- module-view.js
 * menangani array kosong ini dengan aman (panel deviasi otomatis tidak
 * dirender). Fokus di sini murni trend ZeroError/SpanError (%) dari 3-Monthly
 * Normal Calibration, rutin tiap kunjungan PM.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var BSE23_TAG_IDS = ['CCH-SCAL-200A', 'CCH-SCAL-200B'];

window.DCS_MODULES['BELT CONVEYOR E2-E3'] = {
  key: 'BELT CONVEYOR E2-E3',
  tabLabel: 'Belt Conveyor E2-E3',
  tabOrder: 15,
  adapterKey: 'BELT CONVEYOR E2-E3',
  tagIds: BSE23_TAG_IDS,

  deviationPairs: [],

  kpis: [
    { key: 'lastZeroError', label: 'Zero Error Terakhir', source: 'lastValue', series: 'ZeroError' },
    { key: 'lastSpanError', label: 'Span Error Terakhir', source: 'lastValue', series: 'SpanError' },
    { key: 'lastLoadZero',  label: 'Load Zero Terakhir',  source: 'lastValue', series: 'LoadZero' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',      label: 'Tanggal' },
    { key: 'pic',       label: 'Teknisi' },
    { key: 'ZeroError', label: 'Zero Error (%)' },
    { key: 'SpanError', label: 'Span Error (%)' },
    { key: 'LoadZero',  label: 'Load Zero (PPM)' },
    { key: 'LoadSpan',  label: 'Load Span (PPM)' },
    { key: 'recordId',  label: 'Record' }
  ]
};
