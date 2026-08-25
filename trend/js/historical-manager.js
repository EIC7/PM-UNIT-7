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
    'SO2': window.SO2Adapter
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

  /**
   * Load data historical untuk SEMUA tag yang punya sourceModul terdaftar
   * di ADAPTERS, dibatasi oleh rentang waktu aktif.
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

    var modulKeys = Object.keys(ADAPTERS);
    var promises = modulKeys.map(function (modulKey) {
      return window.SupabaseAdapter.fetchByModulAndRange(modulKey, range.start, range.end)
        .then(function (rows) {
          return { modulKey: modulKey, rows: rows };
        })
        .catch(function (err) {
          console.error('[HistoricalManager] Gagal fetch modul ' + modulKey + ':', err);
          return { modulKey: modulKey, rows: [], error: err };
        });
    });

    Promise.all(promises).then(function (results) {
      var merged = {};
      results.forEach(function (res) {
        var adapter = ADAPTERS[res.modulKey];
        if (!adapter) return;
        var parsed = adapter.parseRecords(res.rows);
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
