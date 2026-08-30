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
 * 2 sisi (a=CCH-SCAL-200A/Conveyor 200A, b=CCH-SCAL-200B/Conveyor 200B) =
 * 2 tag. TIDAK ADA pasangan before/after alami antar tag (masing-masing
 * conveyor independen) -- config/modules/beltscale-e23.config.js sengaja
 * deviationPairs:[] (kosong), sama pola dengan o2-outlet.config.js.
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

  var SIDES = [
    { side: 'a', tagId: 'CCH-SCAL-200A' },
    { side: 'b', tagId: 'CCH-SCAL-200B' }
  ];

  // key hasil -> [checksIdx-atau-null, threeMonthlyKey-atau-null]
  var SERIES_KEYS = [
    'ZeroError', 'SpanError', 'QuickZeroCheck',
    'LoadZero', 'LoadSpan', 'Pass1', 'Pass2', 'Pass3',
    'AvgPulseLength', 'ZeroCheckUnloaded', 'TestLoadCheck'
  ];
  var THREE_MONTHLY_MAP = {
    ZeroError: '8', SpanError: '9',
    LoadZero: '1z', LoadSpan: '1', Pass1: '2', Pass2: '3', Pass3: '4',
    AvgPulseLength: '5', ZeroCheckUnloaded: '6', TestLoadCheck: '7'
  };
  var CHECKS_IDX_FOR_QUICK_ZERO = 6; // BS_CHECKS[6] = item no.'6a' "Error Zero Calibration"

  function makeEmptyResult() {
    var result = {};
    SIDES.forEach(function (s) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[s.tagId] = obj;
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

      SIDES.forEach(function (s) {
        var id = s.tagId;

        var qz = toNum(quickZero[s.side]);
        if (qz !== null) result[id].QuickZeroCheck.push({ time: t, value: qz, recordId: r.id, pic: r.pic });

        SERIES_KEYS.forEach(function (sk) {
          var tmKey = THREE_MONTHLY_MAP[sk];
          if (!tmKey) return;
          var raw = tmv['bs3m' + s.side.toUpperCase() + '_' + tmKey];
          var val = toNum(raw);
          if (val !== null) result[id][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
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
