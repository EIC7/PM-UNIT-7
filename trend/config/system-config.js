/**
 * ==========================================================================
 * SYSTEM CONFIG — DCS TREND MONITORING SYSTEM
 * ==========================================================================
 * Konfigurasi global sistem. Ubah nilai di sini untuk menyesuaikan target
 * deployment tanpa harus menyentuh logic di file lain.
 * ==========================================================================
 */
window.DCS_CONFIG = {

  APP_NAME: 'DCS TREND MONITORING SYSTEM',
  APP_VERSION: '0.1.0-phase1',

  /* ------------------------------------------------------------------
   * DATA SOURCE — SUPABASE (dipakai untuk HISTORICAL TREND)
   * Sengaja pakai project + anon key yang SAMA dengan repo PM-UNIT-7
   * (Mahfudjtf/PM-UNIT-7 -> shared.js) supaya trend menampilkan data
   * PM/kalibrasi yang REAL, bukan dummy. Anon key ini read-only by
   * design (RLS di sisi Supabase), aman dipakai di client-side.
   * ------------------------------------------------------------------ */
  SUPABASE: {
    URL: 'https://ruvvximnnacpvvoogbzs.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE1NDAsImV4cCI6MjA5NDYxNzU0MH0.GRu5n0Jl2fP0V8L_QLN2Tkmd0Aw0JbMRu25I7t-R7l8',
    TABLE: 'pm_records',
    // Kolom yang diminta saat fetch daftar record historical. "data" WAJIB
    // di-select karena nilai kalibrasi (aDCS/aLocal/dst) ada di dalamnya.
    SELECT_COLUMNS: 'id,modul,tanggal,pic,work_order,unit,data,created_at,updated_at',
    FETCH_LIMIT: 500
  },

  /* ------------------------------------------------------------------
   * MODE OPERASI DATA
   * live   : LiveTrendEngine + Simulator (lihat js/simulator.js) — DISABLED
   *          di Phase ini sesuai arahan: prioritas HISTORICAL dulu.
   * historical : SupabaseAdapter (read-only) dari pm_records — ACTIVE.
   * ------------------------------------------------------------------ */
  LIVE_TREND_ENABLED: false,
  HISTORICAL_TREND_ENABLED: true,

  /* ------------------------------------------------------------------
   * STORAGE
   * ------------------------------------------------------------------ */
  MAX_RECORDS_PER_TAG: 100000,
  LOCAL_STORAGE_PREFIX: 'dcsTrend_',

  /* ------------------------------------------------------------------
   * QUICK RANGE (Historical Trend)
   * Nilai dalam menit. "7D" dan seterusnya ditambahkan karena data PM/
   * kalibrasi sifatnya event-based (jarang per-menit), tapi preset asli
   * dari spec (5M..24H) tetap dipertahankan.
   * ------------------------------------------------------------------ */
  QUICK_RANGES: [
    { key: '5M',  label: '5M',  minutes: 5 },
    { key: '15M', label: '15M', minutes: 15 },
    { key: '30M', label: '30M', minutes: 30 },
    { key: '1H',  label: '1H',  minutes: 60 },
    { key: '4H',  label: '4H',  minutes: 240 },
    { key: '8H',  label: '8H',  minutes: 480 },
    { key: '12H', label: '12H', minutes: 720 },
    { key: '24H', label: '24H', minutes: 1440 },
    { key: '7D',  label: '7D',  minutes: 10080 },
    { key: '30D', label: '30D', minutes: 43200 },
    { key: '90D', label: '90D', minutes: 129600 },
    { key: '1Y',  label: '1Y',  minutes: 525600 },
    { key: '2Y',  label: '2Y',  minutes: 1051200 },
    { key: '3Y',  label: '3Y',  minutes: 1576800 },
    { key: 'CUSTOM', label: 'CUSTOM', minutes: null }
  ],

  DEFAULT_QUICK_RANGE: '90D', // data kalibrasi jarang, default rentang lebih panjang

  UPDATE_INTERVAL_DEFAULT: 1000,

  /* ------------------------------------------------------------------
   * GAP BREAK (Chart Manager)
   * Kalau jarak antar 2 titik historical berturutan > nilai ini (menit),
   * garis di grafik DIPUTUS — supaya lompatan waktu besar antar kejadian
   * kalibrasi tidak salah dibaca sebagai tren proses kontinu.
   * Default 3 hari (4320 menit).
   * ------------------------------------------------------------------ */
  GAP_BREAK_MINUTES: 4320
};
