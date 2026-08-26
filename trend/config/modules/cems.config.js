/**
 * ==========================================================================
 * KONFIGURASI MODUL: CEMS Calibration
 * ==========================================================================
 * Data diambil dari pm_records modul 'CEMS Calibration'.
 * Frekuensi kalibrasi CEMS bervariasi (2-Weekly, Monthly, 3-Monthly, 2-Yearly)
 * sehingga tab dipisah agar tren tiap frekuensi terbaca jelas:
 *
 *   CEMS-WEEKLY-1  : 2-Weekly (calibration ke-1 / tab minggu pertama)
 *   CEMS-WEEKLY-2  : 2-Weekly (calibration ke-2 / tab minggu kedua)
 *   CEMS-MONTHLY   : Monthly calibration
 *   CEMS-YEARLY    : 2-Yearly calibration
 *
 * Setiap tab memuat series: SO2, NOx, CO, CO2, O2 (nilai aktual DCS vs
 * expected / reference standard) yang diparse oleh cems-adapter.js.
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

/* ── Helper pembuat config tab CEMS ──────────────────────────────────── */
function _makeCemsModule(key, tabLabel, tabOrder, freqFilter) {
  return {
    key: key,
    tabLabel: tabLabel,
    tabOrder: tabOrder,
    adapterKey: key,
    freqFilter: freqFilter,      // nilai data.meta.frequency yang masuk tab ini

    /* Tag IDs — setiap parameter CEMS jadi "tag" di UI */
    tagIds: [
      'CEMS-SO2-ZERO', 'CEMS-SO2-SPAN1', 'CEMS-SO2-SPAN2',
      'CEMS-NOx-ZERO', 'CEMS-NOx-SPAN2',
      'CEMS-CO-ZERO',  'CEMS-CO-SPAN1',
      'CEMS-CO2-ZERO', 'CEMS-CO2-SPAN1',
      'CEMS-O2-ZERO'
    ],

    /* Panel deviasi: actual vs expected untuk tiap parameter utama */
    deviationPairs: [
      {
        key: 'so2Zero',
        label: 'Deviasi SO2 Zero (Actual − Expected)',
        seriesA: 'SO2_zero_actual',
        seriesB: 'SO2_zero_exp',
        toleranceValue: 2,
        unit: 'ppm',
        description: 'Selisih pembacaan SO2 aktual saat zero gas vs expected 0. Tren naik = drift zero SO2.'
      },
      {
        key: 'so2Span',
        label: 'Deviasi SO2 Span (Actual − Expected)',
        seriesA: 'SO2_span1_actual',
        seriesB: 'SO2_span1_exp',
        toleranceValue: 439.80 * 0.02,
        unit: 'ppm',
        description: 'Selisih SO2 aktual vs reference span gas. Tren naik = span drift.'
      },
      {
        key: 'noxZero',
        label: 'Deviasi NOx Zero (Actual − Expected)',
        seriesA: 'NOx_zero_actual',
        seriesB: 'NOx_zero_exp',
        toleranceValue: 2,
        unit: 'ppm',
        description: 'Selisih NOx aktual saat zero gas.'
      }
    ],

    /* KPI ringkasan */
    kpis: [
      { key: 'lastSO2Zero',   label: 'SO2 Zero Terakhir',  source: 'lastValue', series: 'SO2_zero_actual' },
      { key: 'lastSO2Span',   label: 'SO2 Span Terakhir',  source: 'lastValue', series: 'SO2_span1_actual' },
      { key: 'lastNOxZero',   label: 'NOx Zero Terakhir',  source: 'lastValue', series: 'NOx_zero_actual' },
      { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
    ],

    /* Kolom tabel log */
    logTableColumns: [
      { key: 'time',       label: 'Tanggal' },
      { key: 'pic',        label: 'Teknisi' },
      { key: 'frequency',  label: 'Frekuensi' },
      { key: 'SO2_zero_actual', label: 'SO2 Zero' },
      { key: 'SO2_span1_actual', label: 'SO2 Span1' },
      { key: 'NOx_zero_actual', label: 'NOx Zero' },
      { key: 'CO_zero_actual',  label: 'CO Zero' },
      { key: 'recordId',   label: 'Record' }
    ]
  };
}

window.DCS_MODULES['CEMS-WEEKLY-1'] = _makeCemsModule(
  'CEMS-WEEKLY-1', 'CEMS 2-Weekly #1', 2, '2-Weekly'
);
window.DCS_MODULES['CEMS-WEEKLY-2'] = _makeCemsModule(
  'CEMS-WEEKLY-2', 'CEMS 2-Weekly #2', 3, '2-Weekly'
);
window.DCS_MODULES['CEMS-MONTHLY'] = _makeCemsModule(
  'CEMS-MONTHLY', 'CEMS Monthly', 4, 'Monthly'
);
window.DCS_MODULES['CEMS-YEARLY'] = _makeCemsModule(
  'CEMS-YEARLY', 'CEMS 2-Yearly', 5, '2-Yearly'
);
