/**
 * ==========================================================================
 * KONFIGURASI MODUL: LD (Leak Detection)
 * ==========================================================================
 * 10 titik leak detection (suhu lokal area rawan bocor: superheater,
 * reheater, economizer, bottom slope). Data berasal dari form yang SAMA
 * dengan FEGT (fegt.html, lihat fegt.config.js) tapi ditampilkan sebagai
 * grafik/tab TERPISAH karena besaran fisiknya beda makna (bukan suhu gas
 * keluar furnace, tapi indikasi kebocoran via suhu permukaan/lokal).
 * ==========================================================================
 */
window.DCS_MODULES = window.DCS_MODULES || {};

window.DCS_MODULES['LD'] = {
  key: 'LD',
  tabLabel: 'LD — Leak Detection',
  tabOrder: 2,
  adapterKey: 'FEGT', // sengaja SAMA dengan fegt.config.js -- 1 fetch Supabase dipakai bersama (lihat js/adapters/fegt-adapter.js)
  tagIds: ['LD-1', 'LD-2', 'LD-3', 'LD-4', 'LD-5', 'LD-6', 'LD-7', 'LD-8', 'LD-9', 'LD-10'],

  deviationPairs: [],

  kpis: [],

  logTableColumns: [
    { key: 'time',     label: 'Tanggal' },
    { key: 'pic',      label: 'Teknisi' },
    { key: 'Temp',     label: 'Temp (\u00b0C)' },
    { key: 'recordId', label: 'Record' }
  ]
};
