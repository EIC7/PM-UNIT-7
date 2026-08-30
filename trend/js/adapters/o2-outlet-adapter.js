/**
 * ==========================================================================
 * O2 WEEKLY OUTLET ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'PM_O2_WEEKLY_OUTLET') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record (lihat weekly_calibration_o2_outlet.html,
 * dbCollectData() -> data.channels):
 *   data.channels.och1..och6 = {
 *     tag, o2Reading, voltage, temperature, lifetime, resistance,
 *     readingCatatan
 *   }
 * 6 channel = 6 tag. BEDA dari O2 Inlet: form Outlet TIDAK punya
 * before/after calibration (cuma 1 pembacaan O2Reading per channel), jadi
 * TIDAK ADA pasangan deviasi alami di sini — config/modules/o2-outlet.config.js
 * sengaja deviationPairs:[] (kosong), fokusnya trend nilai O2Reading + KPI
 * kesehatan cell (Voltage/Resistance dst) dari series tambahan di bawah.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var CHANNEL_COUNT = 6;
  var SERIES_KEYS = ['O2Reading', 'Voltage', 'Temperature', 'Lifetime', 'Resistance'];
  var FIELD_MAP = {
    O2Reading: 'o2Reading',
    Voltage: 'voltage',
    Temperature: 'temperature',
    Lifetime: 'lifetime',
    Resistance: 'resistance'
  };

  function tagId(ch) { return 'O2-OUTLET-CH' + ch; }

  function makeEmptyResult() {
    var result = {};
    for (var ch = 1; ch <= CHANNEL_COUNT; ch++) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[tagId(ch)] = obj;
    }
    return result;
  }

  function parseO2OutletRecords(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var channels = (r.data && r.data.channels) || {};

      for (var ch = 1; ch <= CHANNEL_COUNT; ch++) {
        var c = channels['och' + ch];
        if (!c) continue;
        var id = tagId(ch);
        SERIES_KEYS.forEach(function (sk) {
          var val = toNum(c[FIELD_MAP[sk]]);
          if (val !== null) result[id][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
        });
      }
    });

    Object.keys(result).forEach(function (id) {
      Object.keys(result[id]).forEach(function (sk) {
        result[id][sk].sort(function (a, b) { return a.time - b.time; });
      });
    });

    return result;
  }

  window.O2OutletAdapter = {
    modulKey: 'O2_WEEKLY_OUTLET',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseO2OutletRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['O2_WEEKLY_OUTLET'] = window.O2OutletAdapter;
})();
