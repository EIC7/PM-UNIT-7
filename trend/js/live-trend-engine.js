/**
 * ==========================================================================
 * LIVE TREND ENGINE — STUB / NON-AKTIF di Phase ini
 * ==========================================================================
 * PENTING: modul ini SENGAJA belum diaktifkan. Arahan saat ini memprioritas-
 * kan HISTORICAL TREND dengan data nyata dari Supabase (lihat
 * historical-manager.js). Live Trend butuh sumber data proses kontinu
 * (real-time tag values) yang belum tersedia dari repo PM-UNIT-7 — file di
 * sana adalah form checksheet/kalibrasi (event-based), bukan live feed.
 *
 * Struktur di bawah ini disiapkan supaya saat sumber live (simulator, API,
 * WebSocket, dst) tersedia, tinggal panggil LiveTrendEngine.start() tanpa
 * perlu mengubah arsitektur lain (ChartManager, TagManager, dll).
 * ==========================================================================
 */
(function () {
  'use strict';

  var running = false;
  var buffers = {}; // tagId -> ring buffer of {time, value}
  var MAX_BUFFER_POINTS = 600; // contoh: 10 menit data @1s

  function pushPoint(tagId, time, value) {
    if (!buffers[tagId]) buffers[tagId] = [];
    buffers[tagId].push({ time: time, value: value });
    if (buffers[tagId].length > MAX_BUFFER_POINTS) buffers[tagId].shift();
  }

  function start() {
    if (!window.DCS_CONFIG.LIVE_TREND_ENABLED) {
      console.log('[LiveTrendEngine] LIVE_TREND_ENABLED=false — engine tidak dijalankan di phase ini.');
      return;
    }
    running = true;
    console.log('[LiveTrendEngine] started (belum ada implementasi sumber data live).');
  }

  function stop() { running = false; }
  function isRunning() { return running; }
  function getBuffer(tagId) { return buffers[tagId] || []; }

  window.LiveTrendEngine = {
    start: start,
    stop: stop,
    isRunning: isRunning,
    pushPoint: pushPoint,
    getBuffer: getBuffer
  };
})();
