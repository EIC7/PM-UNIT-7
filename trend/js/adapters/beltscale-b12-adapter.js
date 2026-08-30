/**
 * ==========================================================================
 * BELT CONVEYOR B1-B2 ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'BELT CONVEYOR B1-B2') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record (lihat beltscale-b12.html, dbCollectData()):
 *   data.checks['6a'] = {a, b}                -- Monthly, Error Zero Calibration (%)
 *   data.threeMonthlyValues['bs3m<A|B>_<n>']   -- 3 Monthly, angka mentah string
 * 2 titik ukur: A = CCH-SCAL-100A (Conveyor 100A), B = CCH-SCAL-100B
 * (Conveyor 100B) — kode/nama diambil dari BS_CFG di beltscale-b12.html.
 *
 * 2026-08-30: dipecah dari 2 tag (A/B, tiap tag 11 series campur) jadi 4 tag
 * SEMPIT supaya bisa dikelompokkan jadi 3 tab trend terpisah lewat
 * config/modules/beltscale-b12.config.js:
 *   - "Error Zero": ZeroCalibration (Monthly) + ZeroError (3-Monthly)
 *   - "Beltscale A/B Value": SpanError + 8 series diagnostik lain
 *     (DiagLoadZero/Span, PulsePass1-3, PulsePerMeter, ZeroCheckUnloaded,
 *     TestLoadCheck), per sisi.
 * Tidak ada pasangan before/after alami, jadi
 * config/modules/beltscale-b12.config.js sengaja deviationPairs:[] (kosong).
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  // key -> [threeMonthlyValues suffix] (null = ambil dari data.checks['6a'] bukan threeMonthlyValues)
  var TM_FIELD_MAP = {
    ZeroCalibration: null,
    ZeroError: '8',
    SpanError: '9',
    DiagLoadZero: '1z',
    DiagLoadSpan: '1',
    PulsePass1: '2',
    PulsePass2: '3',
    PulsePass3: '4',
    PulsePerMeter: '5',
    ZeroCheckUnloaded: '6',
    TestLoadCheck: '7'
  };

  var SERIES_KEYS = Object.keys(TM_FIELD_MAP);

  // tag ID sempit -> {side, seriesKeys yang masuk tag itu}
  var TAG_MAP = {
    'BELTB12-A-ERRORZERO': { side: 'a', series: ['ZeroCalibration', 'ZeroError'] },
    'BELTB12-B-ERRORZERO': { side: 'b', series: ['ZeroCalibration', 'ZeroError'] },
    'BELTB12-A-VALUE':     { side: 'a', series: ['SpanError', 'DiagLoadZero', 'DiagLoadSpan', 'PulsePass1', 'PulsePass2', 'PulsePass3', 'PulsePerMeter', 'ZeroCheckUnloaded', 'TestLoadCheck'] },
    'BELTB12-B-VALUE':     { side: 'b', series: ['SpanError', 'DiagLoadZero', 'DiagLoadSpan', 'PulsePass1', 'PulsePass2', 'PulsePass3', 'PulsePerMeter', 'ZeroCheckUnloaded', 'TestLoadCheck'] }
  };

  function makeEmptyResult() {
    var result = {};
    Object.keys(TAG_MAP).forEach(function (tagId) {
      var obj = {};
      TAG_MAP[tagId].series.forEach(function (k) { obj[k] = []; });
      result[tagId] = obj;
    });
    return result;
  }

  function parseBeltscaleB12Records(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var data = r.data || {};
      var zeroCal = (data.checks && data.checks['6a']) || {};
      var tmVals = data.threeMonthlyValues || {};

      Object.keys(TAG_MAP).forEach(function (tagId) {
        var cfg = TAG_MAP[tagId];
        cfg.series.forEach(function (sk) {
          var suffix = TM_FIELD_MAP[sk];
          var raw = suffix === null
            ? zeroCal[cfg.side]
            : tmVals['bs3m' + cfg.side.toUpperCase() + '_' + suffix];
          var val = toNum(raw);
          if (val !== null) result[tagId][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
        });
      });
    });

    Object.keys(result).forEach(function (id) {
      Object.keys(result[id]).forEach(function (sk) {
        result[id][sk].sort(function (a, b) { return a.time - b.time; });
      });
    });

    return result;
  }

  window.BeltscaleB12Adapter = {
    modulKey: 'BELT CONVEYOR B1-B2',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseBeltscaleB12Records
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['BELT CONVEYOR B1-B2'] = window.BeltscaleB12Adapter;
})();
