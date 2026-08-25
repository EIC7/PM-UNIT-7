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
 * Catatan (§8.2 Trend Fitur.MD): sebelumnya adapter ini hanya menarik
 * DCS & Local. Zero/Span/Before/After sudah tersimpan di DB sejak awal
 * tapi belum pernah dipakai — sekarang ditarik juga supaya bisa dipakai
 * ModuleView untuk panel deviasi (Before-After = besaran koreksi drift).
 *
 * Pola ini dijadikan CONTOH — modul HTML lain (opacity.html, fegt.html,
 * ph-analyzer.html, dst) tinggal dibuatkan adapter serupa di folder ini
 * (js/adapters/<modul>-adapter.js) lalu didaftarkan di
 * config/modules/<modul>.config.js — TIDAK perlu ubah chart-manager.js,
 * ui-manager.js, atau module-view.js.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var SERIES_KEYS = ['DCS', 'Local', 'Zero', 'Span', 'Before', 'After'];

  /**
   * @param {Array} rows - hasil SupabaseAdapter.fetchByModulAndRange('SO2', ...)
   * @returns {Object} map tagId -> { seriesKey: [{ time, value, recordId, pic }] }
   */
  function parseSO2Records(rows) {
    var result = {
      'SO2-7FC-AT-7A': { DCS: [], Local: [], Zero: [], Span: [], Before: [], After: [] },
      'SO2-7FC-AT-7B': { DCS: [], Local: [], Zero: [], Span: [], Before: [], After: [] }
    };

    (rows || []).forEach(function (r) {
      var a = (r.data && r.data.analyzer) || {};
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      var prefixMap = { 'SO2-7FC-AT-7A': 'a', 'SO2-7FC-AT-7B': 'c' };
      Object.keys(prefixMap).forEach(function (tagId) {
        var p = prefixMap[tagId];
        SERIES_KEYS.forEach(function (sk) {
          var raw = a[p + sk]; // contoh: aDCS, aZero, cBefore, dst
          var val = toNumber(raw);
          if (val !== null) {
            result[tagId][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
          }
        });
      });
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
    seriesKeys: SERIES_KEYS,
    parseRecords: parseSO2Records
  };
})();
