/**
 * ==========================================================================
 * COMMUNICATION MANAGER
 * ==========================================================================
 * Menyiapkan jalur interkoneksi antar halaman HTML (Phase 3 di roadmap
 * asli) + internal API window.DCSTrend supaya halaman lain bisa terhubung.
 *
 * Di Phase ini (fokus Historical Trend + SO2), BroadcastChannel/CustomEvent
 * TIDAK dipakai untuk update live value (karena LIVE_TREND_ENABLED=false),
 * tapi tetap disiapkan berfungsi penuh supaya Phase berikutnya tinggal
 * pasang, tanpa ubah arsitektur.
 * ==========================================================================
 */
(function () {
  'use strict';

  var CHANNEL_NAME = 'dcs_trend_channel';
  var channel = null;

  function initBroadcastChannel() {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[CommunicationManager] BroadcastChannel tidak didukung browser ini.');
      return;
    }
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = function (event) { processIncomingData(event.data); };
    console.log('[CommunicationManager] BroadcastChannel "' + CHANNEL_NAME + '" siap.');
  }

  function processIncomingData(payload) {
    if (!payload || !payload.type) return;
    try {
      switch (payload.type) {
        case 'TAG_UPDATE':
          DCSTrend.updateTag({ id: payload.tagId, value: payload.value, timestamp: payload.timestamp });
          break;
        case 'TAG_REGISTER':
          DCSTrend.registerTag(payload.tag);
          break;
        default:
          console.warn('[CommunicationManager] Tipe pesan tidak dikenal:', payload.type);
      }
    } catch (err) {
      console.error('[CommunicationManager] Gagal proses pesan masuk:', err);
    }
  }

  function broadcast(payload) {
    if (channel) channel.postMessage(payload);
    window.dispatchEvent(new CustomEvent('dcsTagUpdate', { detail: payload }));
  }

  /* ------------------------------------------------------------------
   * window.DCSTrend — Internal JS API
   * ------------------------------------------------------------------ */
  var DCSTrend = {
    registerTag: function (tag) {
      var res = window.TagManager.registerTag(tag);
      if (res.ok) window.dispatchEvent(new CustomEvent('dcsTagListChanged'));
      return res;
    },
    updateTag: function (idOrObj, maybeValue) {
      var patch;
      if (typeof idOrObj === 'string') {
        patch = { value: maybeValue, timestamp: Date.now() };
        return window.TagManager.updateTagMeta(idOrObj, patch);
      }
      patch = { value: idOrObj.value, timestamp: idOrObj.timestamp || Date.now(), quality: idOrObj.quality || 'GOOD' };
      return window.TagManager.updateTagMeta(idOrObj.id, patch);
    },
    getTag: function (id) { return window.TagManager.getTag(id); },
    getAllTags: function () { return window.TagManager.getAllTags(); },
    deleteTag: function (id) { return window.TagManager.deleteTag(id); },
    setTagVisibility: function (id, visible) { return window.TagManager.setVisibility(id, visible); },
    getHistoricalData: function (tagId) {
      var state = window.HistoricalManager.getState();
      return (state.lastLoadedSeries && state.lastLoadedSeries[tagId]) || null;
    },
    exportData: function (tagId, format) {
      if (window.ExportManager) return window.ExportManager.exportTag(tagId, format);
      console.error('[DCSTrend] ExportManager belum termuat.');
    },
    /** Dipakai halaman LAIN untuk broadcast update ke Trend System ini. */
    broadcastTagUpdate: function (tagId, value) {
      broadcast({ type: 'TAG_UPDATE', tagId: tagId, value: value, timestamp: Date.now() });
    }
  };

  window.DCSTrend = DCSTrend;

  window.CommunicationManager = {
    init: function () { initBroadcastChannel(); },
    processIncomingData: processIncomingData,
    broadcast: broadcast
  };
})();
