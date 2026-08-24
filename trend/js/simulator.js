/**
 * ==========================================================================
 * SIMULATOR ENGINE — STUB / NON-AKTIF di Phase ini
 * ==========================================================================
 * Modul terpisah sesuai spec supaya nanti gampang dimatikan ketika data
 * aktual sudah tersedia — di Phase ini malah sebaliknya: DIMATIKAN dari
 * awal karena prioritas adalah data aktual (Supabase) via Historical Trend.
 * Kerangka simulasi tetap ditinggal di sini sebagai referensi Phase
 * berikutnya (Live Trend).
 * ==========================================================================
 */
(function () {
  'use strict';

  function generateNextValue(prevValue, cfg, t) {
    cfg = cfg || { baseValue: 0, variation: 1, noise: 0.1, speed: 1 };
    var wave = Math.sin(t / (1000 / cfg.speed)) * cfg.variation;
    var noise = (Math.random() - 0.5) * cfg.noise;
    return cfg.baseValue + wave + noise;
  }

  var timers = {};

  function startForTag(tag) {
    if (!window.DCS_CONFIG.LIVE_TREND_ENABLED) {
      console.log('[Simulator] Dilewati untuk tag ' + tag.id + ' — LIVE_TREND_ENABLED=false.');
      return;
    }
    if (timers[tag.id]) return; // sudah jalan
    var interval = tag.updateInterval || window.DCS_CONFIG.UPDATE_INTERVAL_DEFAULT;
    timers[tag.id] = setInterval(function () {
      var t = Date.now();
      var next = generateNextValue(tag.value, tag.simulationConfig, t);
      window.DCSTrend.updateTag(tag.id, next);
    }, interval);
  }

  function stopForTag(tagId) {
    if (timers[tagId]) { clearInterval(timers[tagId]); delete timers[tagId]; }
  }

  function stopAll() {
    Object.keys(timers).forEach(stopForTag);
  }

  window.Simulator = {
    generateNextValue: generateNextValue,
    startForTag: startForTag,
    stopForTag: stopForTag,
    stopAll: stopAll
  };
})();
