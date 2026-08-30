/**
 * ==========================================================================
 * pH ANALYZER ADAPTER — parser modul 'Analyzer Indicator Transmitter (pH)'
 * ==========================================================================
 * Struktur data di dalam record (lihat ph-analyzer.html:dbCollectData):
 *   data.steps[idx][unitId] = { phBuf_<uid2>_<idx>, phSlope_<uid2>,
 *     phOffset_<uid2>, phTemp_<uid2>, phLocalpH_<uid2>, phLocalmA_<uid2>,
 *     phDCSpH_<uid2>, phDCSmA_<uid2>, unitChk }
 * dengan uid2 = unitId dengan '-' diganti '_'. Field non-buffer (Slope/
 * Offset/Temp/Local & DCS) SENGAJA disimpan berulang di semua baris step
 * non-check untuk unit yang sama (form-nya menulis 1 set field per unit,
 * bukan per baris) — jadi cukup ambil dari step manapun yang punya field
 * itu, tidak perlu baris spesifik. Field Buffer (3 titik verifikasi,
 * target 4/7/10) BEDA per baris (index step 5/6/7 di array PH_STEPS) —
 * diambil berurutan (idx ascending) sebagai Buffer1/2/3, bukan hardcode
 * angka index literal, supaya lebih tahan kalau PH_STEPS berubah urutan.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var PH_UNIT_IDS = ['CWT-AIT-502', 'CWT-AIT-503', 'CWT-AIT-507', 'CWT-AIT-512', 'CWT-AIT-513', 'CWT-AIT-936'];

  var SERIES_KEYS = [
    'DCSPH', 'LocalPH', 'DCSMA', 'LocalMA', 'Slope', 'Offset', 'Temperature',
    'Buffer1Reading', 'Buffer2Reading', 'Buffer3Reading'
  ];

  function emptySeriesMap() {
    var m = {};
    SERIES_KEYS.forEach(function (sk) { m[sk] = []; });
    return m;
  }

  function tagId(unitId) { return 'PH-' + unitId; }

  function parsePhRecords(rows) {
    var result = {};
    PH_UNIT_IDS.forEach(function (u) { result[tagId(u)] = emptySeriesMap(); });

    (rows || []).forEach(function (r) {
      var steps = (r.data && r.data.steps) || {};
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var stepIdxKeys = Object.keys(steps).sort(function (a, b) { return Number(a) - Number(b); });

      PH_UNIT_IDS.forEach(function (unitId) {
        var uid2 = unitId.replace(/-/g, '_');
        var slope = null, offset = null, temp = null, localPH = null, localMA = null, dcsPH = null, dcsMA = null;
        var bufReadings = []; // ascending by step idx -> Buffer1/2/3 in order found

        stepIdxKeys.forEach(function (idxKey) {
          var cell = steps[idxKey] && steps[idxKey][unitId];
          if (!cell) return;
          if (slope === null && cell['phSlope_' + uid2] !== undefined) slope = toNumber(cell['phSlope_' + uid2]);
          if (offset === null && cell['phOffset_' + uid2] !== undefined) offset = toNumber(cell['phOffset_' + uid2]);
          if (temp === null && cell['phTemp_' + uid2] !== undefined) temp = toNumber(cell['phTemp_' + uid2]);
          if (localPH === null && cell['phLocalpH_' + uid2] !== undefined) localPH = toNumber(cell['phLocalpH_' + uid2]);
          if (localMA === null && cell['phLocalmA_' + uid2] !== undefined) localMA = toNumber(cell['phLocalmA_' + uid2]);
          if (dcsPH === null && cell['phDCSpH_' + uid2] !== undefined) dcsPH = toNumber(cell['phDCSpH_' + uid2]);
          if (dcsMA === null && cell['phDCSmA_' + uid2] !== undefined) dcsMA = toNumber(cell['phDCSmA_' + uid2]);
          var bufKey = 'phBuf_' + uid2 + '_' + idxKey;
          if (cell[bufKey] !== undefined) {
            var bv = toNumber(cell[bufKey]);
            if (bv !== null) bufReadings.push(bv);
          }
        });

        var tid = tagId(unitId);
        var push = function (sk, val) { if (val !== null) result[tid][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic }); };
        push('DCSPH', dcsPH);
        push('LocalPH', localPH);
        push('DCSMA', dcsMA);
        push('LocalMA', localMA);
        push('Slope', slope);
        push('Offset', offset);
        push('Temperature', temp);
        push('Buffer1Reading', bufReadings[0] !== undefined ? bufReadings[0] : null);
        push('Buffer2Reading', bufReadings[1] !== undefined ? bufReadings[1] : null);
        push('Buffer3Reading', bufReadings[2] !== undefined ? bufReadings[2] : null);
      });
    });

    Object.keys(result).forEach(function (tid) {
      Object.keys(result[tid]).forEach(function (sk) {
        result[tid][sk].sort(function (p1, p2) { return p1.time - p2.time; });
      });
    });

    return result;
  }

  window.PhAnalyzerAdapter = {
    modulKey: 'Analyzer Indicator Transmitter (pH)',
    seriesKeys: SERIES_KEYS,
    parseRecords: parsePhRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['Analyzer Indicator Transmitter (pH)'] = window.PhAnalyzerAdapter;
})();
