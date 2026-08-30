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
 * 2 titik ukur = 2 tag: A = CCH-SCAL-100A (Conveyor 100A), B = CCH-SCAL-100B
 * (Conveyor 100B) — kode/nama diambil dari BS_CFG di beltscale-b12.html.
 * Tidak ada pasangan before/after alami (semua bacaan independen), jadi
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

  var SERIES_KEYS = [
    'ZeroCalibration', 'ZeroError', 'SpanError',
    'DiagLoadZero', 'DiagLoadSpan',
    'PulsePass1', 'PulsePass2', 'PulsePass3', 'PulsePerMeter',
    'ZeroCheckUnloaded', 'TestLoadCheck'
  ];

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

  var POINTS = [
    { id: 'BELTB12-A', side: 'a' },
    { id: 'BELTB12-B', side: 'b' }
  ];

  function makeEmptyResult() {
    var result = {};
    POINTS.forEach(function (p) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[p.id] = obj;
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

      POINTS.forEach(function (p) {
        SERIES_KEYS.forEach(function (sk) {
          var suffix = TM_FIELD_MAP[sk];
          var raw = suffix === null
            ? zeroCal[p.side]
            : tmVals['bs3m' + p.side.toUpperCase() + '_' + suffix];
          var val = toNum(raw);
          if (val !== null) result[p.id][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
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
