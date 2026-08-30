/**
 * ==========================================================================
 * KONFIGURASI MODUL: Belt Conveyor B1-B2 — 3 TAB TERPISAH
 * ==========================================================================
 * 2026-08-30: dipecah dari 1 module ('BELT CONVEYOR B1-B2', 2 tag A/B
 * campur 11 series) jadi 3 DCS_MODULES entry terpisah -- SATU adapter yang
 * sama (adapterKey tetap 'BELT CONVEYOR B1-B2', 1 fetch Supabase dipakai
 * bareng) tapi tiap entry cuma nunjuk ke subset tagIds-nya sendiri (pola
 * sama dengan FEGT+LD berbagi 1 adapter):
 *   1. "Error Zero"          -- ZeroCalibration + ZeroError, sisi A & B
 *   2. "Beltscale A Value"   -- SpanError + 8 diagnostik, sisi A saja
 *   3. "Beltscale B Value"   -- SpanError + 8 diagnostik, sisi B saja
 * Semua bacaan adalah nilai INDEPENDEN -- tidak ada pasangan before/after
 * atau actual/expected alami di sumber datanya, jadi deviationPairs sengaja
 * dikosongkan di ketiga entry.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['BELT_B12_ERRORZERO'] = {
  key: 'BELT_B12_ERRORZERO',
  tabLabel: 'Error Zero',
  tabOrder: 14,
  adapterKey: 'BELT CONVEYOR B1-B2',
  tagIds: ['BELTB12-A-ERRORZERO', 'BELTB12-B-ERRORZERO'],

  deviationPairs: [],

  kpis: [
    { key: 'lastZeroCal',   label: 'Zero Calibration Terakhir', source: 'lastValue', series: 'ZeroCalibration' },
    { key: 'lastZeroError', label: 'Zero Error Terakhir',       source: 'lastValue', series: 'ZeroError' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi',      source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',           label: 'Tanggal' },
    { key: 'pic',            label: 'Teknisi' },
    { key: 'ZeroCalibration', label: 'Zero Calibration (%)' },
    { key: 'ZeroError',      label: 'Zero Error (%)' },
    { key: 'recordId',       label: 'Record' }
  ]
};

window.DCS_MODULES['BELT_B12_A_VALUE'] = {
  key: 'BELT_B12_A_VALUE',
  tabLabel: 'Beltscale A Value',
  tabOrder: 15,
  adapterKey: 'BELT CONVEYOR B1-B2',
  tagIds: ['BELTB12-A-VALUE'],

  deviationPairs: [],

  kpis: [
    { key: 'lastSpanError', label: 'Span Error Terakhir', source: 'lastValue', series: 'SpanError' },
    { key: 'lastDiagLoadZero', label: 'Diag Load Zero Terakhir', source: 'lastValue', series: 'DiagLoadZero' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',              label: 'Tanggal' },
    { key: 'pic',                label: 'Teknisi' },
    { key: 'SpanError',          label: 'Span Error (%)' },
    { key: 'DiagLoadZero',       label: 'Diag Load Zero (PPM)' },
    { key: 'DiagLoadSpan',       label: 'Diag Load Span (PPM)' },
    { key: 'PulsePass1',         label: 'Pulse Pass 1 (Meter)' },
    { key: 'PulsePass2',         label: 'Pulse Pass 2 (Meter)' },
    { key: 'PulsePass3',         label: 'Pulse Pass 3 (Meter)' },
    { key: 'PulsePerMeter',      label: 'Avg Pulse/Meter (PPM)' },
    { key: 'ZeroCheckUnloaded',  label: 'Zero Check Unloaded (PPM)' },
    { key: 'TestLoadCheck',      label: 'Test Load Check (PPM)' },
    { key: 'recordId',           label: 'Record' }
  ]
};

window.DCS_MODULES['BELT_B12_B_VALUE'] = {
  key: 'BELT_B12_B_VALUE',
  tabLabel: 'Beltscale B Value',
  tabOrder: 16,
  adapterKey: 'BELT CONVEYOR B1-B2',
  tagIds: ['BELTB12-B-VALUE'],

  deviationPairs: [],

  kpis: [
    { key: 'lastSpanError', label: 'Span Error Terakhir', source: 'lastValue', series: 'SpanError' },
    { key: 'lastDiagLoadZero', label: 'Diag Load Zero Terakhir', source: 'lastValue', series: 'DiagLoadZero' },
    { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
  ],

  logTableColumns: [
    { key: 'time',              label: 'Tanggal' },
    { key: 'pic',                label: 'Teknisi' },
    { key: 'SpanError',          label: 'Span Error (%)' },
    { key: 'DiagLoadZero',       label: 'Diag Load Zero (PPM)' },
    { key: 'DiagLoadSpan',       label: 'Diag Load Span (PPM)' },
    { key: 'PulsePass1',         label: 'Pulse Pass 1 (Meter)' },
    { key: 'PulsePass2',         label: 'Pulse Pass 2 (Meter)' },
    { key: 'PulsePass3',         label: 'Pulse Pass 3 (Meter)' },
    { key: 'PulsePerMeter',      label: 'Avg Pulse/Meter (PPM)' },
    { key: 'ZeroCheckUnloaded',  label: 'Zero Check Unloaded (PPM)' },
    { key: 'TestLoadCheck',      label: 'Test Load Check (PPM)' },
    { key: 'recordId',           label: 'Record' }
  ]
};
