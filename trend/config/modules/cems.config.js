/**
 * ==========================================================================
 * KONFIGURASI MODUL: CEMS Calibration
 * ==========================================================================
 * Data diambil dari pm_records modul 'CEMS Calibration'. Setiap tag di sini
 * = 1 parameter kalibrasi (SO2 Zero, SO2 Span1, NOx Zero, dst), dengan 2
 * series: Actual (pembacaan CEMS) vs Expected (nilai reference gas) — pola
 * yang PERSIS SAMA dengan DCS vs Local di so2.config.js (lihat file itu
 * sebagai cetakan asli). deviationPairs & kpis di bawah generik: berlaku
 * untuk TAG APA PUN yang sedang dicentang di tab ini, bukan tag spesifik.
 *
 * Frekuensi kalibrasi CEMS ada 4 macam (2-Weekly x2 kejadian per bulan,
 * Monthly, 2-Yearly) — dipisah jadi 4 tab, MASING-MASING PAKAI TAG ID
 * SENDIRI (prefix CEMS-W1-*, CEMS-W2-*, CEMS-M-*, CEMS-Y-*) supaya tidak
 * saling tabrak saat pindah tab (lihat catatan penting di
 * js/adapters/cems-adapter.js).
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

var CEMS_PARAM_SUFFIXES = [
  'SO2-ZERO', 'SO2-SPAN1', 'SO2-SPAN2',
  'NOX-ZERO', 'NOX-SPAN2',
  'CO-ZERO', 'CO-SPAN1',
  'CO2-ZERO', 'CO2-SPAN1',
  'O2-ZERO'
];

function _makeCemsModule(registryKey, prefix, tabLabel, tabOrder) {
  return {
    key: registryKey, // HARUS sama persis dengan key di window.DCS_MODULES[...] di bawah
    tabLabel: tabLabel,
    tabOrder: tabOrder,
    adapterKey: 'CEMS', // SEMUA tab CEMS pakai 1 adapter yang sama -> 1x fetch Supabase (lihat cems-adapter.js)
    tagIds: CEMS_PARAM_SUFFIXES.map(function (suf) { return prefix + '-' + suf; }),

    deviationPairs: [
      {
        key: 'actualVsExpected',
        label: 'Deviasi Actual − Expected',
        seriesA: 'Actual',
        seriesB: 'Expected',
        // Tolok ukur baku beda-beda per parameter (ppm utk gas, % utk CO2/O2)
        // jadi TIDAK dipaksa 1 angka toleransi generik — dipakai buat lihat
        // tren drift, bukan pass/fail otomatis (sama seperti Before/After di SO2).
        toleranceValue: null,
        unit: '',
        description: 'Selisih pembacaan CEMS (Actual) vs nilai reference gas kalibrasi (Expected), per kejadian kalibrasi. Tren menjauh dari 0 = indikasi analyzer drift.'
      }
    ],

    kpis: [
      { key: 'lastActual',    label: 'Actual Terakhir',   source: 'lastValue', series: 'Actual' },
      { key: 'lastExpected',  label: 'Expected Terakhir', source: 'lastValue', series: 'Expected' },
      { key: 'lastDeviation', label: 'Deviasi Terakhir',  source: 'lastDeviation', pair: 'actualVsExpected' },
      { key: 'daysSinceCal',  label: 'Hari Sejak Kalibrasi', source: 'daysSinceLastRecord' }
    ],

    logTableColumns: [
      { key: 'time',     label: 'Tanggal' },
      { key: 'pic',      label: 'Teknisi' },
      { key: 'Actual',   label: 'Actual' },
      { key: 'Expected', label: 'Expected' },
      { key: 'recordId', label: 'Record' }
    ]
  };
}

window.DCS_MODULES['CEMS-WEEKLY-1'] = _makeCemsModule('CEMS-WEEKLY-1', 'CEMS-W1', 'CEMS 2-Weekly #1', 3);
window.DCS_MODULES['CEMS-WEEKLY-2'] = _makeCemsModule('CEMS-WEEKLY-2', 'CEMS-W2', 'CEMS 2-Weekly #2', 4);
window.DCS_MODULES['CEMS-MONTHLY']  = _makeCemsModule('CEMS-MONTHLY',  'CEMS-M',  'CEMS Monthly', 5);
// "3-Monthly" adalah salah satu pilihan frequency di cems_calibration.html
// (radio name="freq") yang sempat tidak punya tab sama sekali di sini —
// record dengan frequency itu diam-diam ke-drop total oleh cems-adapter.js
// (tidak error, cuma tidak pernah nongol di grafik manapun).
window.DCS_MODULES['CEMS-3MONTHLY']  = _makeCemsModule('CEMS-3MONTHLY',  'CEMS-3M', 'CEMS 3-Monthly', 6);
window.DCS_MODULES['CEMS-YEARLY']   = _makeCemsModule('CEMS-YEARLY',   'CEMS-Y',  'CEMS 2-Yearly', 7);
