/**
 * ==========================================================================
 * FLOW METER FGD ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'Flow Meter FGD Inlet & Quencher')
 * menjadi titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record (lihat flow-meter-fgd.html, dbCollectData()):
 *   data.reading.before['101'|'103'|'201'|'203'] = string angka (m3/Hr)
 *   data.reading.after['101'|'103'|'201'|'203']  = string angka (m3/Hr)
 *   data.params.insf[key] = Insertion Factor (tidak locked, bisa berubah)
 *   data.params.pf[key]   = Profile Factor (tidak locked, bisa berubah)
 * 4 asset = 4 tag (1 per flow transmitter fisik). Series utama Before/After
 * (m3/Hr, sebelum/sesudah cleaning & correction, dipakai panel deviasi —
 * pola persis beforeVsAfter di so2.config.js / o2-inlet.config.js). Series
 * InsertionFactor/ProfileFactor (parameter kalibrasi yang bisa drift antar
 * PM cycle) ikut ditarik untuk KPI & tabel log, TIDAK tampil di chart utama
 * secara default (lihat config/default-tags-flow-meter-fgd.js,
 * defaultVisible:false).
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var ASSET_KEYS = ['101', '103', '201', '203'];
  var SERIES_KEYS = ['Before', 'After', 'InsertionFactor', 'ProfileFactor'];

  function tagId(key) { return 'FM-' + key; }

  function makeEmptyResult() {
    var result = {};
    ASSET_KEYS.forEach(function (key) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[tagId(key)] = obj;
    });
    return result;
  }

  function parseFlowMeterFgdRecords(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var data = r.data || {};
      var reading = data.reading || {};
      var params = data.params || {};

      ASSET_KEYS.forEach(function (key) {
        var id = tagId(key);
        var before = toNum(reading.before ? reading.before[key] : null);
        if (before !== null) result[id].Before.push({ time: t, value: before, recordId: r.id, pic: r.pic });
        var after = toNum(reading.after ? reading.after[key] : null);
        if (after !== null) result[id].After.push({ time: t, value: after, recordId: r.id, pic: r.pic });
        var insf = toNum(params.insf ? params.insf[key] : null);
        if (insf !== null) result[id].InsertionFactor.push({ time: t, value: insf, recordId: r.id, pic: r.pic });
        var pf = toNum(params.pf ? params.pf[key] : null);
        if (pf !== null) result[id].ProfileFactor.push({ time: t, value: pf, recordId: r.id, pic: r.pic });
      });
    });

    Object.keys(result).forEach(function (id) {
      Object.keys(result[id]).forEach(function (sk) {
        result[id][sk].sort(function (a, b) { return a.time - b.time; });
      });
    });

    return result;
  }

  window.FlowMeterFgdAdapter = {
    modulKey: 'Flow Meter FGD',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseFlowMeterFgdRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['Flow Meter FGD'] = window.FlowMeterFgdAdapter;
})();
