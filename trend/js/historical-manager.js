/**
 * ==========================================================================
 * HISTORICAL TREND MANAGER
 * ==========================================================================
 * Mengatur Start/End Date-Time, Quick Range, dan LOAD DATA.
 * Historical Trend TIDAK mengikuti live data secara otomatis — hanya
 * menampilkan data ketika user menekan [LOAD DATA] atau memilih quick range.
 *
 * ADAPTERS: peta modulKey -> parser. Untuk mengaktifkan modul lain
 * (opacity, fegt, ph, dst) di masa depan, cukup tambah entry baru di sini
 * setelah adapter parser-nya dibuat di js/adapters/<modul>-adapter.js
 * (contoh: js/adapters/so2-adapter.js).
 * ==========================================================================
 */
(function () {
  'use strict';

  var ADAPTERS = {
    'SO2':          window.SO2Adapter,
    'CEMS-WEEKLY-1': window.CEMSAdapter['CEMS-WEEKLY-1'],
    'CEMS-WEEKLY-2': window.CEMSAdapter['CEMS-WEEKLY-2'],
    'CEMS-MONTHLY':  window.CEMSAdapter['CEMS-MONTHLY'],
    'CEMS-YEARLY':   window.CEMSAdapter['CEMS-YEARLY']
  };

  var state = {
    startTime: null,
    endTime: null,
    activeRangeKey: window.DCS_CONFIG.DEFAULT_QUICK_RANGE,
    lastLoadedSeries: {}, // tagId -> { seriesKey: [{time,value}] }
    loading: false
  };

  function computeRangeFromQuick(key) {
    var preset = window.DCS_CONFIG.QUICK_RANGES.filter(function (r) { return r.key === key; })[0];
    if (!preset || preset.minutes === null) return null;
    var end = Date.now();
    var start = end - preset.minutes * 60 * 1000;
    return { start: start, end: end };
  }

  /* Peta dari adapterKey ke nama modul di Supabase (pm_records.modul) */
  var ADAPTER_MODUL_MAP = {
    'SO2':           'SO2 Scrubber Inlet',
    'CEMS-WEEKLY-1': 'CEMS Calibration',
    'CEMS-WEEKLY-2': 'CEMS Calibration',
    'CEMS-MONTHLY':  'CEMS Calibration',
    'CEMS-YEARLY':   'CEMS Calibration'
  };

  /**
   * Load data historical untuk SEMUA tag yang punya sourceModul terdaftar
   * di ADAPTERS, dibatasi oleh rentang waktu aktif.
   * Modul Supabase yang sama (mis. semua CEMS-*) hanya di-fetch SEKALI.
   */
  function loadData(onDone, onError) {
    if (state.loading) { console.warn('[HistoricalManager] Sedang loading, request diabaikan.'); return; }
    state.loading = true;
    window.dispatchEvent(new CustomEvent('dcsHistoricalLoadStart'));

    var range = state.activeRangeKey === 'CUSTOM'
      ? { start: state.startTime, end: state.endTime }
      : computeRangeFromQuick(state.activeRangeKey);

    if (!range || !range.start || !range.end) {
      state.loading = false;
      var err = new Error('Range waktu tidak valid.');
      console.error('[HistoricalManager]', err.message);
      if (onError) onError(err);
      return;
    }

    /* Deduplikasi: kumpulkan unique Supabase modul names */
    var modulKeys = Object.keys(ADAPTERS);
    var uniqueSupabaseModuls = {};
    modulKeys.forEach(function (k) {
      var sm = ADAPTER_MODUL_MAP[k] || k;
      if (!uniqueSupabaseModuls[sm]) uniqueSupabaseModuls[sm] = [];
      uniqueSupabaseModuls[sm].push(k);
    });

    var fetchPromises = Object.keys(uniqueSupabaseModuls).map(function (supabaseModul) {
      return window.SupabaseAdapter.fetchByModulAndRange(supabaseModul, range.start, range.end)
        .then(function (rows) { return { supabaseModul: supabaseModul, rows: rows }; })
        .catch(function (err) {
          console.error('[HistoricalManager] Gagal fetch modul ' + supabaseModul + ':', err);
          return { supabaseModul: supabaseModul, rows: [], error: err };
        });
    });

    Promise.all(fetchPromises).then(function (results) {
      /* Buat map supabaseModul -> rows */
      var rowsMap = {};
      results.forEach(function (res) { rowsMap[res.supabaseModul] = res.rows; });

      /* Jalankan setiap adapter dengan rows yang sesuai */
      var merged = {};
      modulKeys.forEach(function (adapterKey) {
        var adapter = ADAPTERS[adapterKey];
        if (!adapter) return;
        var sm = ADAPTER_MODUL_MAP[adapterKey] || adapterKey;
        var rows = rowsMap[sm] || [];
        var parsed = adapter.parseRecords(rows);
        Object.assign(merged, parsed);
      });

      state.lastLoadedSeries = merged;
      state.loading = false;
      window.dispatchEvent(new CustomEvent('dcsHistoricalLoadEnd', { detail: { series: merged, range: range } }));
      if (onDone) onDone(merged, range);
    }).catch(function (err) {
      state.loading = false;
      console.error('[HistoricalManager] loadData error:', err);
      window.dispatchEvent(new CustomEvent('dcsHistoricalLoadError', { detail: { error: err } }));
      if (onError) onError(err);
    });
  }

  function setQuickRange(key) {
    state.activeRangeKey = key;
    if (key !== 'CUSTOM') { state.startTime = null; state.endTime = null; }
  }

  function setCustomRange(startTime, endTime) {
    if (!startTime || !endTime || startTime >= endTime) {
      console.error('[HistoricalManager] Custom range tidak valid (start harus < end).');
      return { ok: false, error: 'INVALID_RANGE' };
    }
    state.activeRangeKey = 'CUSTOM';
    state.startTime = startTime;
    state.endTime = endTime;
    return { ok: true };
  }

  function getState() { return state; }

  window.HistoricalManager = {
    loadData: loadData,
    setQuickRange: setQuickRange,
    setCustomRange: setCustomRange,
    getState: getState,
    ADAPTERS: ADAPTERS
  };
})();
