/**
 * ==========================================================================
 * KONFIGURASI MODUL: Belt Conveyor E2-E3 — 3 TAB TERPISAH
 * ==========================================================================
 * 2026-08-30: dipecah dari 1 module ('BELT CONVEYOR E2-E3', 2 tag A/B
 * campur 11 series) jadi 3 DCS_MODULES entry terpisah -- SATU adapter yang
 * sama (adapterKey tetap 'BELT CONVEYOR E2-E3', 1 fetch Supabase dipakai
 * bareng) tapi tiap entry cuma nunjuk ke subset tagIds-nya sendiri (pola
 * sama dengan FEGT+LD berbagi 1 adapter):
 *   1. "Error Zero"          -- ZeroError + QuickZeroCheck, sisi A & B
 *   2. "Beltscale A Value"   -- SpanError + 8 diagnostik, sisi A saja
 *   3. "Beltscale B Value"   -- SpanError + 8 diagnostik, sisi B saja
 * Tidak ada before/after kalibrasi natural antar tag (2 conveyor
 * independen), jadi deviationPairs sengaja dikosongkan di ketiga entry.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['BELT_E23_ERRORZERO'] = {
  key: 'BELT_E23_ERRORZERO',
  tabLabel: 'Error Zero',
  tabOrder: 15,
  adapterKey: 'BELT CONVEYOR E2-E3',
  tagIds: ['CCH-SCAL-200A-ERRORZERO', 'CCH-SCAL-200B-ERRORZERO'],

  deviationPairs: [],

  kpis: [
    { key: 'lastZeroError',      label: 'Zero Error Terakhir', source: 'lastValue', series: 'ZeroError' },
    { key: 'lastQuickZeroCheck', label: 'Error Zero Cal Terakhir', source: 'lastValue', series: 'QuickZeroCheck' },
    { key: 'daysSinceCal',       label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',           label: 'Tanggal' },
    { key: 'pic',            label: 'Teknisi' },
    { key: 'ZeroError',      label: 'Zero Error (%)' },
    { key: 'QuickZeroCheck', label: 'Error Zero Calibration (%)' },
    { key: 'recordId',       label: 'Record' }
  ]
};

window.DCS_MODULES['BELT_E23_A_VALUE'] = {
  key: 'BELT_E23_A_VALUE',
  tabLabel: 'Beltscale A Value',
  tabOrder: 16,
  adapterKey: 'BELT CONVEYOR E2-E3',
  tagIds: ['CCH-SCAL-200A-VALUE'],

  deviationPairs: [],

  kpis: [
    { key: 'lastSpanError', label: 'Span Error Terakhir', source: 'lastValue', series: 'SpanError' },
    { key: 'lastLoadZero',  label: 'Load Zero Terakhir',  source: 'lastValue', series: 'LoadZero' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',              label: 'Tanggal' },
    { key: 'pic',               label: 'Teknisi' },
    { key: 'SpanError',         label: 'Span Error (%)' },
    { key: 'LoadZero',          label: 'Load Zero (PPM)' },
    { key: 'LoadSpan',          label: 'Load Span (PPM)' },
    { key: 'Pass1',             label: 'Pass 1 (Meter)' },
    { key: 'Pass2',             label: 'Pass 2 (Meter)' },
    { key: 'Pass3',             label: 'Pass 3 (Meter)' },
    { key: 'AvgPulseLength',    label: 'Avg Pulse/Length (PPM)' },
    { key: 'ZeroCheckUnloaded', label: 'Zero Check Unloaded (PPM)' },
    { key: 'TestLoadCheck',     label: 'Test Load Check (PPM)' },
    { key: 'recordId',          label: 'Record' }
  ]
};

window.DCS_MODULES['BELT_E23_B_VALUE'] = {
  key: 'BELT_E23_B_VALUE',
  tabLabel: 'Beltscale B Value',
  tabOrder: 17,
  adapterKey: 'BELT CONVEYOR E2-E3',
  tagIds: ['CCH-SCAL-200B-VALUE'],

  deviationPairs: [],

  kpis: [
    { key: 'lastSpanError', label: 'Span Error Terakhir', source: 'lastValue', series: 'SpanError' },
    { key: 'lastLoadZero',  label: 'Load Zero Terakhir',  source: 'lastValue', series: 'LoadZero' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',              label: 'Tanggal' },
    { key: 'pic',               label: 'Teknisi' },
    { key: 'SpanError',         label: 'Span Error (%)' },
    { key: 'LoadZero',          label: 'Load Zero (PPM)' },
    { key: 'LoadSpan',          label: 'Load Span (PPM)' },
    { key: 'Pass1',             label: 'Pass 1 (Meter)' },
    { key: 'Pass2',             label: 'Pass 2 (Meter)' },
    { key: 'Pass3',             label: 'Pass 3 (Meter)' },
    { key: 'AvgPulseLength',    label: 'Avg Pulse/Length (PPM)' },
    { key: 'ZeroCheckUnloaded', label: 'Zero Check Unloaded (PPM)' },
    { key: 'TestLoadCheck',     label: 'Test Load Check (PPM)' },
    { key: 'recordId',          label: 'Record' }
  ]
};
