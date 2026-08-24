/**
 * ==========================================================================
 * SO2 ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul SO2 Scrubber Inlet) menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data.analyzer di dalam record (lihat so2.html:dbCollectData):
 *   { aDCS, aLocal, aZero, aSpan, aBefore, aAfter,
 *     cDCS, cLocal, cZero, cSpan, cBefore, cAfter }
 *
 * Pola ini dijadikan CONTOH — modul HTML lain (opacity.html, fegt.html,
 * ph-analyzer.html, dst) tinggal dibuatkan adapter serupa lalu didaftarkan
 * di HistoricalManager.ADAPTERS.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  /**
   * @param {Array} rows - hasil SupabaseAdapter.fetchByModulAndRange('SO2', ...)
   * @returns {Object} map tagId -> { seriesKey: [{ time, value, recordId }] }
   */
  function parseSO2Records(rows) {
    var result = {
      'SO2-7FC-AT-7A': { aDCS: [], aLocal: [] },
      'SO2-7FC-AT-7B': { cDCS: [], cLocal: [] }
    };

    (rows || []).forEach(function (r) {
      var a = (r.data && r.data.analyzer) || {};
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      var aDCS = toNumber(a.aDCS);
      var aLocal = toNumber(a.aLocal);
      var cDCS = toNumber(a.cDCS);
      var cLocal = toNumber(a.cLocal);

      if (aDCS !== null) result['SO2-7FC-AT-7A'].aDCS.push({ time: t, value: aDCS, recordId: r.id, pic: r.pic });
      if (aLocal !== null) result['SO2-7FC-AT-7A'].aLocal.push({ time: t, value: aLocal, recordId: r.id, pic: r.pic });
      if (cDCS !== null) result['SO2-7FC-AT-7B'].cDCS.push({ time: t, value: cDCS, recordId: r.id, pic: r.pic });
      if (cLocal !== null) result['SO2-7FC-AT-7B'].cLocal.push({ time: t, value: cLocal, recordId: r.id, pic: r.pic });
    });

    // Urutkan tiap seri berdasarkan waktu (ascending) — wajib untuk chart time-axis.
    Object.keys(result).forEach(function (tagId) {
      Object.keys(result[tagId]).forEach(function (seriesKey) {
        result[tagId][seriesKey].sort(function (p1, p2) { return p1.time - p2.time; });
      });
    });

    return result;
  }

  window.SO2Adapter = {
    modulKey: 'SO2',
    parseRecords: parseSO2Records
  };
})();
