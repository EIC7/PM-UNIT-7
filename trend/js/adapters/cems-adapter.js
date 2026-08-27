/**
 * ==========================================================================
 * CEMS ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'CEMS Calibration') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record CEMS (lihat cems_calibration.html, collectData()):
 *   data.zero   : { CO, CO2, H2O, NOx, SO2, Flow, O2Wet }, masing-masing
 *                 { exp, act } (bukan { actual, expected, deviation, status })
 *   data.span1  : { CO, SO2, CO2 }     — idem
 *   data.span2  : { NOx, SO2 }          — idem
 *   data.meta.frequency : '2-Weekly' | 'Monthly' | '3-Monthly' | '2-Yearly'
 *   PENTING: zero/span1/span2 LANGSUNG di r.data, TIDAK dibungkus
 *   r.data.calibration (bug lama — lihat riwayat commit).
 *
 * SATU TREND PER PARAMETER, DIGABUNG DARI SEMUA FREQUENCY — sempat dipecah
 * jadi 40-50 tag (10 parameter x 4-5 tab per frequency: 2-Weekly #1/#2,
 * Monthly, 3-Monthly, 2-Yearly), tapi itu SALAH secara proses: frequency di
 * Step 1 form cuma menentukan pekerjaan TAMBAHAN (checklist inspeksi Step
 * 9-11) yang ikut dikerjakan saat kunjungan itu — pengukuran kalibrasi
 * Zero/Span1/Span2 (Before/After) sendiri SAMA untuk semua frequency, jadi
 * satu rangkaian kalibrasi yang sama harusnya jadi SATU trend panjang per
 * parameter, bukan dipecah-pecah jadi banyak trend pendek per tab. Lihat
 * §21 Trend Fitur.MD.
 *
 * SATU adapter ini menghasilkan data untuk 10 tag (10 parameter) dari SATU
 * fetch Supabase modul 'CEMS Calibration'.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  /* Parameter yang diplot, sesuai field yang benar-benar ada di form asal.
     tagId = 'CEMS-' + suffix (lihat config/default-tags-cems.js). */
  var PARAMS = [
    { suffix: 'SO2-ZERO',  section: 'zero',  key: 'SO2' },
    { suffix: 'SO2-SPAN1', section: 'span1', key: 'SO2' },
    { suffix: 'SO2-SPAN2', section: 'span2', key: 'SO2' },
    { suffix: 'NOX-ZERO',  section: 'zero',  key: 'NOx' },
    { suffix: 'NOX-SPAN2', section: 'span2', key: 'NOx' },
    { suffix: 'CO-ZERO',   section: 'zero',  key: 'CO' },
    { suffix: 'CO-SPAN1',  section: 'span1', key: 'CO' },
    { suffix: 'CO2-ZERO',  section: 'zero',  key: 'CO2' },
    { suffix: 'CO2-SPAN1', section: 'span1', key: 'CO2' },
    { suffix: 'O2-ZERO',   section: 'zero',  key: 'O2Wet', fallbackKey: 'O2' }
  ];

  function makeEmptyResult() {
    var result = {};
    PARAMS.forEach(function (p) {
      result['CEMS-' + p.suffix] = { Actual: [], Expected: [] };
    });
    return result;
  }

  function parseCemsRecords(rows) {
    var result = makeEmptyResult();
    // Diagnostik per record — dibaca trend_cems.html (#dcsDiagPanel) supaya
    // kelihatan LANGSUNG dari HP kenapa 1 record tertentu tidak nyumbang
    // titik (field zero/span1/span2 masih kosong karena draft belum
    // lengkap diisi) — tanpa perlu buka Supabase manual. Lihat §21 Trend
    // Fitur.MD.
    var debugRows = [];

    var entries = (rows || []).map(function (r) {
      return { row: r, time: window.SupabaseAdapter.recordTimestamp(r) };
    }).filter(function (e) { return e.time !== null; });
    entries.sort(function (a, b) { return a.time - b.time; });

    entries.forEach(function (entry) {
      var r = entry.row, t = entry.time;
      var cal = r.data || {};
      var freq = (cal.meta && cal.meta.frequency) || '(kosong)';
      var filledCount = 0;

      PARAMS.forEach(function (p) {
        var section = cal[p.section] || {};
        var row = section[p.key] || (p.fallbackKey ? section[p.fallbackKey] : null);
        if (!row) return;

        var actual = toNum(row.actual !== undefined ? row.actual : row.act);
        var exp = toNum(row.expected !== undefined ? row.expected : row.exp);
        var tagId = 'CEMS-' + p.suffix;
        var pt = { time: t, recordId: r.id, pic: r.pic };

        if (actual !== null) { result[tagId].Actual.push(Object.assign({ value: actual }, pt)); filledCount++; }
        if (exp !== null) { result[tagId].Expected.push(Object.assign({ value: exp }, pt)); filledCount++; }
      });

      debugRows.push({
        recordId: r.id, tanggal: r.tanggal, status: r.status, pic: r.pic,
        frequency: freq, filledCount: filledCount, maxCount: PARAMS.length * 2
      });
    });

    Object.keys(result).forEach(function (tagId) {
      result[tagId].Actual.sort(function (a, b) { return a.time - b.time; });
      result[tagId].Expected.sort(function (a, b) { return a.time - b.time; });
    });

    window.CemsAdapter.lastParseDebug = debugRows;
    return result;
  }

  window.CemsAdapter = {
    modulKey: 'CEMS',
    seriesKeys: ['Actual', 'Expected'],
    parseRecords: parseCemsRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['CEMS'] = window.CemsAdapter;
})();
