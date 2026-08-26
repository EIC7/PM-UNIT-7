/**
 * ==========================================================================
 * CEMS ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'CEMS Calibration') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record CEMS (lihat cems_calibration.html:collectData):
 *   data.calibration.zero   : { CO, CO2, H2O, NOx, SO2, Flow, O2Wet }
 *                             masing-masing: { actual, expected, deviation, status }
 *   data.calibration.span1  : { CO, SO2, CO2 }     — idem
 *   data.calibration.span2  : { NOx, SO2 }          — idem
 *   data.meta.frequency     : '2-Weekly' | 'Monthly' | '3-Monthly' | '2-Yearly'
 *
 * Tab dipisah berdasarkan frequency dan urutan kalibasi (2-Weekly dibagi
 * ke tab #1 dan #2 — dispatchnya by nomor record genap/ganjil dalam urutan
 * waktu ascending supaya visual trend bisa dibandingkan antar-minggu).
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v); return isNaN(n) ? null : n;
  }

  /* Semua series yang dihasilkan per record */
  var ALL_SERIES = [
    'SO2_zero_actual', 'SO2_zero_exp',
    'SO2_span1_actual', 'SO2_span1_exp',
    'SO2_span2_actual', 'SO2_span2_exp',
    'NOx_zero_actual',  'NOx_zero_exp',
    'NOx_span2_actual', 'NOx_span2_exp',
    'CO_zero_actual',   'CO_zero_exp',
    'CO_span1_actual',  'CO_span1_exp',
    'CO2_zero_actual',  'CO2_zero_exp',
    'CO2_span1_actual', 'CO2_span1_exp',
    'O2_zero_actual',   'O2_zero_exp',
    'frequency'
  ];

  /* Tag IDs yang dipakai (harus cocok dengan cems.config.js tagIds) */
  var ALL_TAG_IDS = [
    'CEMS-SO2-ZERO', 'CEMS-SO2-SPAN1', 'CEMS-SO2-SPAN2',
    'CEMS-NOx-ZERO', 'CEMS-NOx-SPAN2',
    'CEMS-CO-ZERO',  'CEMS-CO-SPAN1',
    'CEMS-CO2-ZERO', 'CEMS-CO2-SPAN1',
    'CEMS-O2-ZERO'
  ];

  function makeEmpty() {
    var o = {};
    ALL_SERIES.forEach(function (s) { o[s] = []; });
    return o;
  }

  function makeResult() {
    var o = {};
    ALL_TAG_IDS.forEach(function (id) { o[id] = makeEmpty(); });
    return o;
  }

  /* Salin nilai ke semua tag (satu record CEMS mengandung SEMUA parameter) */
  function pushToAll(result, seriesKey, point) {
    ALL_TAG_IDS.forEach(function (tagId) {
      if (result[tagId][seriesKey]) result[tagId][seriesKey].push(point);
    });
  }

  function parseCalRow(row, paramKey, prefix, t, recordId, pic, result) {
    /* row = data.calibration[section][paramKey], mis. data.calibration.zero['SO2'] */
    if (!row) return;
    var actual = toNum(row.actual !== undefined ? row.actual : row.dcs);
    var exp    = toNum(row.expected !== undefined ? row.expected : row.exp);
    var baseKey = paramKey + '_' + prefix;
    var pt = { time: t, recordId: recordId, pic: pic };
    if (actual !== null) pushToAll(result, baseKey + '_actual', Object.assign({ value: actual }, pt));
    if (exp    !== null) pushToAll(result, baseKey + '_exp',    Object.assign({ value: exp },    pt));
  }

  /**
   * @param {Array}  rows      - hasil SupabaseAdapter.fetchByModulAndRange
   * @param {string} freqFilter - frequency yang ingin disaring ('2-Weekly' dll)
   * @param {number} weeklySlot - untuk 2-Weekly: 1 = record ganjil, 2 = genap (by index)
   */
  function parseCemsRecords(rows, freqFilter, weeklySlot) {
    var result = makeResult();

    /* Filter by frequency */
    var filtered = (rows || []).filter(function (r) {
      var freq = (r.data && r.data.meta && r.data.meta.frequency) || '';
      return freq === freqFilter;
    });

    /* Urutkan ascending by timestamp dulu */
    filtered.sort(function (a, b) {
      var ta = window.SupabaseAdapter.recordTimestamp(a);
      var tb = window.SupabaseAdapter.recordTimestamp(b);
      return (ta || 0) - (tb || 0);
    });

    /* Untuk 2-Weekly: ambil record index 0,2,4... (slot 1) atau 1,3,5... (slot 2) */
    var toProcess = filtered;
    if (freqFilter === '2-Weekly' && (weeklySlot === 1 || weeklySlot === 2)) {
      toProcess = filtered.filter(function (_, i) {
        return weeklySlot === 1 ? (i % 2 === 0) : (i % 2 === 1);
      });
    }

    toProcess.forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var cal = (r.data && r.data.calibration) || {};
      var meta = (r.data && r.data.meta) || {};
      var recordId = r.id, pic = r.pic;

      /* Zero calibration */
      var zero = cal.zero || {};
      ['SO2','NOx','CO','CO2'].forEach(function (p) {
        parseCalRow(zero[p], p, 'zero', t, recordId, pic, result);
      });
      /* O2 Wet — key di zero adalah O2Wet */
      parseCalRow(zero['O2Wet'] || zero['O2'], 'O2', 'zero', t, recordId, pic, result);

      /* Span 1: CO, SO2, CO2 */
      var span1 = cal.span1 || {};
      ['SO2','CO','CO2'].forEach(function (p) {
        parseCalRow(span1[p], p, 'span1', t, recordId, pic, result);
      });

      /* Span 2: NOx, SO2 */
      var span2 = cal.span2 || {};
      ['NOx','SO2'].forEach(function (p) {
        parseCalRow(span2[p], p, 'span2', t, recordId, pic, result);
      });

      /* Frequency label (untuk tabel log) */
      pushToAll(result, 'frequency', { time: t, value: meta.frequency || freqFilter, recordId: recordId, pic: pic });
    });

    /* Sort tiap series by time */
    ALL_TAG_IDS.forEach(function (tagId) {
      ALL_SERIES.forEach(function (s) {
        if (result[tagId][s]) {
          result[tagId][s].sort(function (a, b) { return a.time - b.time; });
        }
      });
    });

    return result;
  }

  /* Satu fungsi parse per "sub-modul" (dipanggil oleh historical-manager) */
  function makeAdapter(freqFilter, weeklySlot, modulKey) {
    return {
      modulKey: modulKey,
      seriesKeys: ALL_SERIES,
      parseRecords: function (rows) {
        return parseCemsRecords(rows, freqFilter, weeklySlot);
      }
    };
  }

  window.CEMSAdapter = {
    'CEMS-WEEKLY-1': makeAdapter('2-Weekly', 1, 'CEMS-WEEKLY-1'),
    'CEMS-WEEKLY-2': makeAdapter('2-Weekly', 2, 'CEMS-WEEKLY-2'),
    'CEMS-MONTHLY':  makeAdapter('Monthly',  null, 'CEMS-MONTHLY'),
    'CEMS-YEARLY':   makeAdapter('2-Yearly', null, 'CEMS-YEARLY')
  };
})();
