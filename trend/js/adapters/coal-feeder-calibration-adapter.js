/**
 * ==========================================================================
 * COAL FEEDER CALIBRATION ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records menjadi titik-titik historical trend
 * siap-pakai untuk chart-manager.js.
 *
 * Struktur data record (lihat coal_feeder_calibration.html:dbCollectData):
 *   data.cal1.deviation = [dev1, dev2, dev3]  -- 3 titik uji kalibrasi metode 1
 *   data.cal2.deviation = [dev1, dev2, dev3]  -- 3 titik uji kalibrasi metode 2
 *   data.demand['100'].fr_act                 -- flow rate aktual pada demand 100%
 *
 * ⚠️ DUA SUMBER buat Cal1/Cal2: tabel Cal 1/Cal 2 yang sama TERTANAM ULANG di
 * dalam section "4000 HR PM Pulverizer Instrumentation" (Feeder Floor Area,
 * lihat cf4kCalTableHtml() di coal_feeder_calibration.html), input-nya pakai
 * ID BEDA (prefix 'cf4kcal1_'/'cf4kcal2_', bukan 'cal1_'/'cal2_') supaya
 * tidak bentrok DOM dengan tabel standalone-nya. Kalau teknisi ngisi lewat
 * section 4000HR (bukan section Feeder Calibration standalone), nilainya
 * TIDAK masuk ke data.cal1/data.cal2 sama sekali -- malah tersimpan di
 * data.cf4k.floor_feedercal.calValues.cf4kcal1_dev1/2/3 (dan cf4kcal2_*).
 * Adapter ini WAJIB cek kedua lokasi (standalone dulu, fallback ke cf4k
 * kalau standalone kosong) -- kalau cuma baca data.cal1/data.cal2 seperti
 * awalnya, laporan yang diisi lewat 4000HR kelihatan "tidak ada data" di
 * trend padahal datanya ADA, cuma di lokasi lain. Demand Test TIDAK
 * ditemukan versi cf4k-nya (cuma ada di section Test Demand Signal standalone,
 * tidak ditanam ulang di 4000HR) -- jadi Demand100FlowRate tetap 1 sumber saja.
 *
 * 2026-08-30: Feeder No. di coal_feeder_calibration.html berubah dari input
 * teks bebas jadi dropdown TETAP 6 feeder (7BF-PVR-500A..F, PULVERIZER 7A..F)
 * -- modul yang dikirim sekarang JUGA menyertakan kode feeder itu di
 * teksnya sendiri ("Feeder Calibration 7BF-PVR-500A (PULVERIZER 7A)" atau,
 * kalau job 4000HR ikut dicentang, "4000 Hr and Feeder Calibration
 * 7BF-PVR-500A (PULVERIZER 7A)"). Adapter ini sekarang split jadi 6 tag
 * (COAL-FEEDER-A..F) alih-alih 1 tag agregat seperti sebelumnya --
 * extractFeederLetter() menarik huruf feeder dari teks modul (atau, buat
 * data lama sebelum perubahan ini, dari data.feeder_no bebas -- kalau
 * tidak ketemu pola yang cocok di keduanya, baris itu DILEWATI karena tidak
 * bisa dipetakan ke feeder mana pun).
 *
 * modulKey registrasi SENGAJA cuma 'Feeder Calibration' (bukan lagi 'Coal
 * Feeder Calibration') -- substring itu ada di SEMUA varian modul di atas
 * (termasuk data lama yang masih 'Coal Feeder Calibration' polos), jadi
 * ilike.*Feeder Calibration* di fetchByModulAndRange() menangkap semuanya
 * dalam satu query, tanpa perlu tahu feeder-nya duluan.
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

  var FEEDER_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var SERIES_KEYS = ['Cal1DeviationAvg', 'Cal2DeviationAvg', 'Demand100FlowRate'];

  function extractFeederLetter(s) {
    if (!s || typeof s !== 'string') return null;
    var m = /500\s*([A-Fa-f])\b/.exec(s) || /PULVERIZER\s*7\s*([A-Fa-f])\b/i.exec(s);
    return m ? m[1].toUpperCase() : null;
  }

  // Cal1/Cal2 avg: coba tabel standalone dulu (data.cal1/cal2.deviation),
  // fallback ke tabel yang sama tapi diisi lewat section 4000HR
  // (data.cf4k.floor_feedercal.calValues.cf4kcal1_dev1/2/3, dst) kalau yang
  // standalone kosong. Lihat catatan panjang di header file ini.
  function cal1DeviationAvg(d) {
    var std = average(d.cal1 && d.cal1.deviation);
    if (std !== null) return std;
    var cv = d.cf4k && d.cf4k.floor_feedercal && d.cf4k.floor_feedercal.calValues;
    if (!cv) return null;
    return average([cv.cf4kcal1_dev1, cv.cf4kcal1_dev2, cv.cf4kcal1_dev3]);
  }
  function cal2DeviationAvg(d) {
    var std = average(d.cal2 && d.cal2.deviation);
    if (std !== null) return std;
    var cv = d.cf4k && d.cf4k.floor_feedercal && d.cf4k.floor_feedercal.calValues;
    if (!cv) return null;
    return average([cv.cf4kcal2_dev1, cv.cf4kcal2_dev2, cv.cf4kcal2_dev3]);
  }

  function parseCoalFeederCalibrationRecords(rows) {
    var result = {};
    FEEDER_LETTERS.forEach(function (letter) {
      result['COAL-FEEDER-' + letter] = { Cal1DeviationAvg: [], Cal2DeviationAvg: [], Demand100FlowRate: [] };
    });

    (rows || []).forEach(function (r) {
      var d = r.data || {};
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      var letter = extractFeederLetter(r.modul) || extractFeederLetter(d.feeder_no);
      if (!letter || FEEDER_LETTERS.indexOf(letter) === -1) return; // tidak bisa dipetakan ke feeder mana pun -- dilewati
      var tagId = 'COAL-FEEDER-' + letter;

      var cal1Avg = cal1DeviationAvg(d);
      if (cal1Avg !== null) result[tagId].Cal1DeviationAvg.push({ time: t, value: cal1Avg, recordId: r.id, pic: r.pic });

      var cal2Avg = cal2DeviationAvg(d);
      if (cal2Avg !== null) result[tagId].Cal2DeviationAvg.push({ time: t, value: cal2Avg, recordId: r.id, pic: r.pic });

      var demand100 = toNumber(d.demand && d.demand['100'] && d.demand['100'].fr_act);
      if (demand100 !== null) result[tagId].Demand100FlowRate.push({ time: t, value: demand100, recordId: r.id, pic: r.pic });
    });

    Object.keys(result).forEach(function (tagId) {
      Object.keys(result[tagId]).forEach(function (seriesKey) {
        result[tagId][seriesKey].sort(function (p1, p2) { return p1.time - p2.time; });
      });
    });

    return result;
  }

  window.CoalFeederCalibrationAdapter = {
    modulKey: 'Feeder Calibration',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseCoalFeederCalibrationRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['Feeder Calibration'] = window.CoalFeederCalibrationAdapter;
})();
