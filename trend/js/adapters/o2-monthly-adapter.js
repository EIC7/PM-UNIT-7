/**
 * ==========================================================================
 * O2 MONTHLY CLEANING ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul PM_O2_MONTHLY_CLEANING /
 * _INLET / _OUTLET / _INLET_DAN_OUTLET — dicocokkan via substring
 * PM_O2_MONTHLY_CLEANING) menjadi titik-titik historical trend.
 *
 * Struktur data di record (lihat form_o2_report.html, dbCollectData()):
 *   data.channels.ch1..ch8 / och1..och6 = {enabled, tag, catatan,
 *     evidence:[foto], before:[foto], after:[foto]}  <- INLET & OUTLET,
 *     "before"/"after" di sini FOTO dokumentasi cleaning, BUKAN angka.
 *   data.outletReadings.och1..och6 = {before, after, voltage, temp,
 *     lifetime, resistance}  <- HANYA OUTLET, ini satu-satunya bacaan
 *     ANGKA di modul ini (O2% before/after cleaning + kesehatan cell).
 * Channel Inlet (ch1..ch8) TIDAK punya data angka sama sekali (murni
 * dokumentasi foto before/after cleaning) — makanya modul ini HANYA
 * mem-parsing 6 channel Outlet (sama fisik instrumennya dengan
 * weekly_calibration_o2_outlet.html, cuma frekuensi bulanan bukan
 * mingguan). Tag id sengaja O2-MONTHLY-OUTLET-CHn (beda dari
 * O2-OUTLET-CHn milik trend Weekly) supaya kedua modul tidak tertukar.
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
  var SERIES_KEYS = ['Before', 'After', 'Voltage', 'Temperature', 'Lifetime', 'Resistance'];
  var FIELD_MAP = {
    Before: 'before',
    After: 'after',
    Voltage: 'voltage',
    Temperature: 'temp',
    Lifetime: 'lifetime',
    Resistance: 'resistance'
  };

  function tagId(ch) { return 'O2-MONTHLY-OUTLET-CH' + ch; }

  function makeEmptyResult() {
    var result = {};
    for (var ch = 1; ch <= CHANNEL_COUNT; ch++) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[tagId(ch)] = obj;
    }
    return result;
  }

  function parseO2MonthlyRecords(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var outletReadings = (r.data && r.data.outletReadings) || {};

      for (var ch = 1; ch <= CHANNEL_COUNT; ch++) {
        var c = outletReadings['och' + ch];
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

  window.O2MonthlyAdapter = {
    modulKey: 'PM_O2_MONTHLY_CLEANING',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseO2MonthlyRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['PM_O2_MONTHLY_CLEANING'] = window.O2MonthlyAdapter;
})();
