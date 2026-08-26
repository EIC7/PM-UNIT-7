/**
 * ==========================================================================
 * KONFIGURASI MODUL: FEGT (Furnace Exit Gas Temperature)
 * ==========================================================================
 * 21 titik acoustic pyrometry. Grafik terpisah dari LD (lihat
 * ld.config.js) walau datanya berasal dari 1 form/record yang sama
 * (fegt.html) — dipisah di sini karena LD mengukur suhu titik BOCOR
 * (leak detection), bukan suhu gas keluar furnace.
 *
 * Tidak ada deviationPairs/kpis: dengan 21 tag sekaligus, KPI per-tag akan
 * membanjiri layar — cukup pakai panel VALUES (kanan, sudah otomatis
 * menampilkan semua tag yang dicentang + ikut cursor grafik).
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['FEGT'] = {
  key: 'FEGT',
  tabLabel: 'FEGT — Acoustic Pyrometry',
  tabOrder: 1,
  adapterKey: 'FEGT', // harus cocok dengan window.DCS_ADAPTERS['FEGT'] (js/adapters/fegt-adapter.js)
  tagIds: ['FEGT-P1', 'FEGT-P2', 'FEGT-P3', 'FEGT-P4', 'FEGT-P5', 'FEGT-P6', 'FEGT-P7', 'FEGT-P8', 'FEGT-P9', 'FEGT-P10', 'FEGT-P11', 'FEGT-P12', 'FEGT-P13', 'FEGT-P14', 'FEGT-P15', 'FEGT-P16', 'FEGT-P17', 'FEGT-P18', 'FEGT-P19', 'FEGT-P20', 'FEGT-P21'],

  deviationPairs: [], // tiap titik cuma 1 bacaan (Temp) -- tidak ada pasangan alami buat dibandingkan

  kpis: [], // sengaja kosong -- 21 tag x KPI = kepenuhan; pakai panel VALUES

  logTableColumns: [
    { key: 'time',     label: 'Tanggal' },
    { key: 'pic',      label: 'Teknisi' },
    { key: 'Temp',     label: 'Temp (\u00b0C)' },
    { key: 'recordId', label: 'Record' }
  ]
};
