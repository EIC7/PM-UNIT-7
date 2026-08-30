/**
 * ==========================================================================
 * BELT CONVEYOR E2-E3 ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'BELT CONVEYOR E2-E3', dari
 * beltscale-e23.html) menjadi titik-titik historical trend siap-pakai untuk
 * chart-manager.js.
 *
 * Struktur data di record (lihat beltscale-e23.html, dbCollectData()):
 *   data.checks[6] = {a, b}  -- item BS_CHECKS no.'6a' "Error Zero
 *     Calibration" (placeholder "e.g. 0.01%"), index 6 di array BS_CHECKS
 *     (0-based, item bertipe 'header'/'check' sebelumnya dilewati saat
 *     dibangun tapi TETAP dapat index array penuh -- lihat dbCollectData()).
 *   data.threeMonthlyValues['bs3mA_N'/'bs3mB_N'] = string angka, N in
 *     {8,9} (3-Monthly Normal Calibration: Zero/Span Error %) dan
 *     {1z,1,2,3,4,5,6,7} (Defect Preventive Maintenance -- Initial
 *     Calibration, biasanya cuma terisi sekali saat setup awal, bukan tiap
 *     kunjungan PM rutin).
 * 2 sisi (a=CCH-SCAL-200A/Conveyor 200A, b=CCH-SCAL-200B/Conveyor 200B).
 *
 * 2026-08-30: dipecah dari 2 tag (A/B, tiap tag 11 series campur) jadi 4 tag
 * SEMPIT supaya bisa dikelompokkan jadi 3 tab trend terpisah lewat
 * config/modules/beltscale-e23.config.js:
 *   - "Error Zero": ZeroError + QuickZeroCheck (label "Error Zero
 *     Calibration (%)", ekuivalen ZeroCalibration di B1-B2)
 *   - "Beltscale A/B Value": SpanError + 8 series diagnostik lain
 *     (LoadZero/Span, Pass1-3, AvgPulseLength, ZeroCheckUnloaded,
 *     TestLoadCheck), per sisi.
 * TIDAK ADA pasangan before/after alami antar tag (masing-masing conveyor
 * independen) -- deviationPairs sengaja [] di ketiga entry module.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var s = String(v).replace(/[^\d.\-]/g, '');
    if (s === '' || s === '-' || s === '.') return null;
    var n = Number(s);
    return isNaN(n) ? null : n;
  }

  var THREE_MONTHLY_MAP = {
    ZeroError: '8', SpanError: '9',
    LoadZero: '1z', LoadSpan: '1', Pass1: '2', Pass2: '3', Pass3: '4',
    AvgPulseLength: '5', ZeroCheckUnloaded: '6', TestLoadCheck: '7'
  };
  var SERIES_KEYS = ['ZeroError', 'SpanError', 'QuickZeroCheck'].concat(Object.keys(THREE_MONTHLY_MAP).filter(function (k) { return k !== 'ZeroError' && k !== 'SpanError'; }));
  var CHECKS_IDX_FOR_QUICK_ZERO = 6; // BS_CHECKS[6] = item no.'6a' "Error Zero Calibration"

  // tag ID sempit -> {side, seriesKeys yang masuk tag itu}
  var TAG_MAP = {
    'CCH-SCAL-200A-ERRORZERO': { side: 'a', series: ['ZeroError', 'QuickZeroCheck'] },
    'CCH-SCAL-200B-ERRORZERO': { side: 'b', series: ['ZeroError', 'QuickZeroCheck'] },
    'CCH-SCAL-200A-VALUE':     { side: 'a', series: ['SpanError', 'LoadZero', 'LoadSpan', 'Pass1', 'Pass2', 'Pass3', 'AvgPulseLength', 'ZeroCheckUnloaded', 'TestLoadCheck'] },
    'CCH-SCAL-200B-VALUE':     { side: 'b', series: ['SpanError', 'LoadZero', 'LoadSpan', 'Pass1', 'Pass2', 'Pass3', 'AvgPulseLength', 'ZeroCheckUnloaded', 'TestLoadCheck'] }
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

  function parseBeltscaleE23Records(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var d = r.data || {};
      var tmv = d.threeMonthlyValues || {};
      var checks = d.checks || {};
      var quickZero = checks[CHECKS_IDX_FOR_QUICK_ZERO] || {};

      Object.keys(TAG_MAP).forEach(function (tagId) {
        var cfg = TAG_MAP[tagId];
        cfg.series.forEach(function (sk) {
          var val;
          if (sk === 'QuickZeroCheck') {
            val = toNum(quickZero[cfg.side]);
          } else {
            var tmKey = THREE_MONTHLY_MAP[sk];
            val = toNum(tmv['bs3m' + cfg.side.toUpperCase() + '_' + tmKey]);
          }
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

  window.BeltscaleE23Adapter = {
    modulKey: 'BELT CONVEYOR E2-E3',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseBeltscaleE23Records
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['BELT CONVEYOR E2-E3'] = window.BeltscaleE23Adapter;
})();
