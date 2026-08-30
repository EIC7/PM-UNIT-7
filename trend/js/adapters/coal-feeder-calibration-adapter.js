/**
 * ==========================================================================
 * COAL FEEDER CALIBRATION ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'Coal Feeder Calibration') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data record (lihat coal_feeder_calibration.html:dbCollectData):
 *   data.cal1.deviation = [dev1, dev2, dev3]  -- 3 titik uji kalibrasi metode 1
 *   data.cal2.deviation = [dev1, dev2, dev3]  -- 3 titik uji kalibrasi metode 2
 *   data.demand['100'].fr_act                 -- flow rate aktual pada demand 100%
 *
 * Checksheet ini TIDAK punya daftar feeder tetap (feeder_no diisi bebas per
 * submission, bukan enum kanal fisik seperti O2/SO2), jadi berbeda dari pola
 * multi-channel lain di adapter ini: hanya SATU tag agregat
 * ('COAL-FEEDER-CAL') yang menampung tren deviasi kalibrasi & hasil demand
 * test dari waktu ke waktu, apa pun feeder yang sedang dites. Rata-rata dari
 * 3 titik uji dipakai (bukan 3 series terpisah) karena ketiganya adalah
 * pengulangan pengukuran yang sama, bukan 3 titik fisik berbeda.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  function average(arr) {
    var nums = (arr || []).map(toNumber).filter(function (n) { return n !== null; });
    if (!nums.length) return null;
    return nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
  }

  var SERIES_KEYS = ['Cal1DeviationAvg', 'Cal2DeviationAvg', 'Demand100FlowRate'];

  function parseCoalFeederCalibrationRecords(rows) {
    var result = { 'COAL-FEEDER-CAL': { Cal1DeviationAvg: [], Cal2DeviationAvg: [], Demand100FlowRate: [] } };

    (rows || []).forEach(function (r) {
      var d = r.data || {};
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      var cal1Avg = average(d.cal1 && d.cal1.deviation);
      if (cal1Avg !== null) result['COAL-FEEDER-CAL'].Cal1DeviationAvg.push({ time: t, value: cal1Avg, recordId: r.id, pic: r.pic });

      var cal2Avg = average(d.cal2 && d.cal2.deviation);
      if (cal2Avg !== null) result['COAL-FEEDER-CAL'].Cal2DeviationAvg.push({ time: t, value: cal2Avg, recordId: r.id, pic: r.pic });

      var demand100 = toNumber(d.demand && d.demand['100'] && d.demand['100'].fr_act);
      if (demand100 !== null) result['COAL-FEEDER-CAL'].Demand100FlowRate.push({ time: t, value: demand100, recordId: r.id, pic: r.pic });
    });

    Object.keys(result).forEach(function (tagId) {
      Object.keys(result[tagId]).forEach(function (seriesKey) {
        result[tagId][seriesKey].sort(function (p1, p2) { return p1.time - p2.time; });
      });
    });

    return result;
  }

  window.CoalFeederCalibrationAdapter = {
    modulKey: 'Coal Feeder Calibration',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseCoalFeederCalibrationRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['Coal Feeder Calibration'] = window.CoalFeederCalibrationAdapter;
})();
