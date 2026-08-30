/**
 * ==========================================================================
 * GENERATOR STATOR LEAK MONITORING ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul GENERATOR_STATOR_LEAK) menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data.measurement di dalam record (lihat
 * generator_stator_leak_monitoring.html:dbCollectData / MEASUREMENT_DATA) —
 * array TETAP 7 baris (index = urutan parameter, BUKAN key bernama), tiap
 * baris {parameter, unit, oemSpec, before, after}. Tidak ada id unik per
 * baris di source-nya, jadi index array dipakai sebagai penanda parameter
 * (urutan MEASUREMENT_DATA tidak pernah diacak oleh form, aman dipakai).
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var SERIES_KEYS = ['Before', 'After'];

  // Urutan & id HARUS sama dengan MEASUREMENT_DATA di
  // generator_stator_leak_monitoring.html (index array = penanda parameter).
  var PARAM_TAGS = [
    'GSL-FLOW-RATE',
    'GSL-PURGE-AIR-FLOW',
    'GSL-IA-PRESSURE',
    'GSL-CAL-BOTTLE-PRESSURE',
    'GSL-DO-PROBE-LIFE',
    'GSL-H2-READING',
    'GSL-DO-READING'
  ];

  function parseGeneratorStatorLeakRecords(rows) {
    var result = {};
    PARAM_TAGS.forEach(function (tagId) {
      result[tagId] = { Before: [], After: [] };
    });

    (rows || []).forEach(function (r) {
      var measurement = (r.data && r.data.measurement) || [];
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      PARAM_TAGS.forEach(function (tagId, idx) {
        var row = measurement[idx];
        if (!row) return;
        SERIES_KEYS.forEach(function (sk) {
          var val = toNumber(row[sk === 'Before' ? 'before' : 'after']);
          if (val !== null) {
            result[tagId][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
          }
        });
      });
    });

    Object.keys(result).forEach(function (tagId) {
      Object.keys(result[tagId]).forEach(function (seriesKey) {
        result[tagId][seriesKey].sort(function (p1, p2) { return p1.time - p2.time; });
      });
    });

    return result;
  }

  window.GeneratorStatorLeakAdapter = {
    modulKey: 'GENERATOR_STATOR_LEAK',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseGeneratorStatorLeakRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['GENERATOR_STATOR_LEAK'] = window.GeneratorStatorLeakAdapter;
})();
