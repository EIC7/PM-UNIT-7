/**
 * ==========================================================================
 * HISTORICAL TREND MANAGER
 * ==========================================================================
 * Mengatur Start/End Date-Time, Quick Range, dan LOAD DATA.
 * Historical Trend TIDAK mengikuti live data secara otomatis — hanya
 * menampilkan data ketika user menekan [LOAD DATA] atau memilih quick range.
 *
 * ADAPTERS: peta modulKey -> parser, dibangun OTOMATIS dari
 * window.DCS_ADAPTERS (tiap file js/adapters/<modul>-adapter.js
 * mendaftarkan dirinya sendiri ke situ). File ini TIDAK PERNAH perlu
 * diedit untuk menambah modul baru — cukup buat adapter + config baru.
 * ==========================================================================
 */
(function () {
  'use strict';

  function getAdapters() {
    return window.DCS_ADAPTERS || {};
  }

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

    var ADAPTERS = getAdapters();
    var modulKeys = Object.keys(ADAPTERS);
    var promises = modulKeys.map(function (modulKey) {
      var adapter = ADAPTERS[modulKey];
      return window.SupabaseAdapter.fetchByModulAndRange(modulKey, range.start, range.end, adapter && adapter.selectColumns)
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
      var diag = []; // buat panel diagnostik di UI -- lihat trend_fegt.html
      results.forEach(function (res) {
        var adapter = ADAPTERS[res.modulKey];
        var distinctModul = {};
        (res.rows || []).forEach(function (r) { distinctModul[r.modul] = (distinctModul[r.modul] || 0) + 1; });
        diag.push({
          modulKey: res.modulKey,
          rowCount: (res.rows || []).length,
          distinctModul: distinctModul,
          error: res.error ? String(res.error.message || res.error) : null
        });
        if (!adapter) return;
        var parsed = adapter.parseRecords(res.rows);
        Object.assign(merged, parsed);
      });
      state.lastLoadedSeries = merged;
      state.lastLoadDiagnostics = diag;
      state.loading = false;
      window.dispatchEvent(new CustomEvent('dcsHistoricalLoadEnd', { detail: { series: merged, range: range, diagnostics: diag } }));
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
    getAdapters: getAdapters
  };
})();
