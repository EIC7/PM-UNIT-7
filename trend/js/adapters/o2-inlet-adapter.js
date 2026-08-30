/**
 * ==========================================================================
 * O2 WEEKLY INLET ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'PM_O2_WEEKLY_INLET') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record (lihat weekly_calibration_o2_inlet.html,
 * dbCollectData() -> data.channels):
 *   data.channels.ch1..ch8 = {
 *     tag, o2BeforeCalibration, o2AfterCalibration,
 *     cellVoltage, cellTemperature, cellLifetime, cellResistance,
 *     gasRatioSpanBefore/Zero, gasRatioSpanAfter/Zero,
 *     calibrationO2Span, calibrationO2Zero, calibCatatan
 *   }
 * 8 channel = 8 tag (satu per elemen analyzer fisik, sama pola dengan
 * SO2 1 tag = 1 analyzer). Series utama Before/After (O2% sebelum/sesudah
 * kalibrasi, dipakai panel deviasi "Koreksi Kalibrasi" — pola persis
 * beforeVsAfter di so2.config.js). Series kesehatan cell (Voltage/
 * Temperature/Lifetime/Resistance) ikut ditarik untuk KPI & tabel log,
 * TIDAK tampil di chart utama secara default (lihat
 * config/default-tags-o2-inlet.js, defaultVisible:false).
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var CHANNEL_COUNT = 8;
  var SERIES_KEYS = ['Before', 'After', 'CellVoltage', 'CellTemperature', 'CellLifetime', 'CellResistance'];
  var FIELD_MAP = {
    Before: 'o2BeforeCalibration',
    After: 'o2AfterCalibration',
    CellVoltage: 'cellVoltage',
    CellTemperature: 'cellTemperature',
    CellLifetime: 'cellLifetime',
    CellResistance: 'cellResistance'
  };

  function tagId(ch) { return 'O2-INLET-CH' + ch; }

  function makeEmptyResult() {
    var result = {};
    for (var ch = 1; ch <= CHANNEL_COUNT; ch++) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[tagId(ch)] = obj;
    }
    return result;
  }

  function parseO2InletRecords(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var channels = (r.data && r.data.channels) || {};

      for (var ch = 1; ch <= CHANNEL_COUNT; ch++) {
        var c = channels['ch' + ch];
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

  window.O2InletAdapter = {
    modulKey: 'O2_WEEKLY_INLET',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseO2InletRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['O2_WEEKLY_INLET'] = window.O2InletAdapter;
})();
