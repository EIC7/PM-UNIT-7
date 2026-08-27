/**
 * ==========================================================================
 * KONFIGURASI MODUL: CEMS Calibration
 * ==========================================================================
 * Data diambil dari pm_records modul 'CEMS Calibration'. Setiap tag di sini
 * = 1 parameter kalibrasi (SO2 Zero, SO2 Span1, NOx Zero, dst), dengan 2
 * series: Actual (pembacaan CEMS) vs Expected (nilai reference gas) — pola
 * yang PERSIS SAMA dengan DCS vs Local di so2.config.js (lihat file itu
 * sebagai cetakan asli). deviationPairs & kpis di bawah generik: berlaku
 * untuk TAG APA PUN yang sedang dicentang, bukan tag spesifik.
 *
 * SATU MODUL SAJA (bukan dipisah per frequency) — frequency kalibrasi CEMS
 * (2-Weekly, Monthly, 3-Monthly, 2-Yearly, dipilih di Step 1 form) cuma
 * menentukan pekerjaan TAMBAHAN (checklist inspeksi Step 9-11) yang ikut
 * dikerjakan saat kunjungan itu — pengukuran kalibrasi Zero/Span1/Span2
 * (Before/After) sendiri SAMA untuk semua frequency. Sempat dipecah jadi
 * 4-5 tab/module (1 per frequency) dan itu salah: memecah 1 rangkaian
 * kalibrasi yang sama jadi banyak trend pendek terpisah, bukannya 1 trend
 * panjang yang benar mengikuti waktu. Lihat §21 Trend Fitur.MD.
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

window.DCS_MODULES['CEMS'] = {
  key: 'CEMS',
  tabLabel: 'CEMS Calibration',
  tabOrder: 3,
  adapterKey: 'CEMS',
  tagIds: CEMS_PARAM_SUFFIXES.map(function (suf) { return 'CEMS-' + suf; }),

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
      description: 'Selisih pembacaan CEMS (Actual) vs nilai reference gas kalibrasi (Expected), per kejadian kalibrasi (semua frequency digabung). Tren menjauh dari 0 = indikasi analyzer drift.'
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
