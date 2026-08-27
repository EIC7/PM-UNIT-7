/**
 * ==========================================================================
 * CEMS ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'CEMS Calibration') menjadi
 * titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record CEMS (lihat cems_calibration.html):
 *   data.calibration.zero   : { CO, CO2, H2O, NOx, SO2, Flow, O2Wet }
 *                             masing-masing: { actual, expected, deviation, status }
 *   data.calibration.span1  : { CO, SO2, CO2 }     — idem
 *   data.calibration.span2  : { NOx, SO2 }          — idem
 *   data.meta.frequency     : '2-Weekly' | 'Monthly' | '3-Monthly' | '2-Yearly'
 *
 * PENTING — TAG ID UNIK PER TAB: kalibrasi CEMS punya 4 frekuensi berbeda
 * (dipisah jadi 4 tab di cems.config.js: 2-Weekly #1, 2-Weekly #2, Monthly,
 * 2-Yearly). Tiap tab dapat SET TAG ID SENDIRI (prefix CEMS-W1-*, CEMS-W2-*,
 * CEMS-M-*, CEMS-Y-*) — BUKAN reuse tag ID yang sama di 4 tab. Kalau di-
 * reuse, centang/uncentang 1 tag di tab Monthly akan ikut mengubah tag yang
 * "sama" (secara ID) di tab Weekly, karena TagManager cuma kenal 1 objek
 * tag per ID — pindah tab jadi saling tabrak (lihat §15 Trend Fitur.MD soal
 * kenapa module-view.js butuh identitas tag yang bersih per modul).
 *
 * SATU adapter ini menghasilkan data untuk SEMUA 40 tag (10 parameter x 4
 * tab) dari SATU fetch Supabase modul 'CEMS Calibration' — historical-
 * manager.js otomatis hanya fetch modul ini SEKALI meski dipakai oleh 4
 * module config berbeda (cems.config.js), karena keempatnya menunjuk ke
 * adapter yang sama (window.DCS_ADAPTERS['CEMS']), persis pola FEGT+LD.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  /* Parameter yang diplot, sesuai field yang benar-benar ada di form asal */
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

  /* 5 tab, masing-masing prefix tag ID + filter frequency + slot (buat 2-Weekly).
     HARUS mencakup SEMUA pilihan frequency di cems_calibration.html (lihat
     radio name="freq": 2-Weekly/Monthly/3-Monthly/2-Yearly) — "3-Monthly"
     sempat tidak ada tab-nya sama sekali, jadi record dengan frequency itu
     diam-diam ke-drop total (tidak error, cuma tidak pernah nongol di
     grafik manapun). Ketauan lewat #dcsDiagPanel di trend_cems.html. */
  var TABS = [
    { prefix: 'CEMS-W1', freq: '2-Weekly',  slot: 1 },
    { prefix: 'CEMS-W2', freq: '2-Weekly',  slot: 2 },
    { prefix: 'CEMS-M',  freq: 'Monthly',   slot: null },
    { prefix: 'CEMS-3M', freq: '3-Monthly', slot: null },
    { prefix: 'CEMS-Y',  freq: '2-Yearly',  slot: null }
  ];

  function makeEmptyResult() {
    var result = {};
    TABS.forEach(function (tab) {
      PARAMS.forEach(function (p) {
        result[tab.prefix + '-' + p.suffix] = { Actual: [], Expected: [] };
      });
    });
    return result;
  }

  function parseCemsRecords(rows) {
    var result = makeEmptyResult();
    // Diagnostik per record — dibaca trend_cems.html (#dcsDiagPanel) supaya
    // kelihatan LANGSUNG dari HP kenapa 1 record tertentu tidak nyumbang
    // titik (frequency tidak dikenal 4 tab, atau field zero/span1/span2
    // masih kosong karena draft belum lengkap diisi) — tanpa perlu buka
    // Supabase manual. Lihat §20 Trend Fitur.MD.
    var debugRows = [];

    // Kelompokkan per frequency dulu, urutkan ascending by waktu — perlu
    // urutan yang benar sebelum membagi 2-Weekly ke slot 1 (index genap)
    // dan slot 2 (index ganjil).
    var byFreq = {};
    var recognizedIds = {};
    (rows || []).forEach(function (r) {
      var freq = (r.data && r.data.meta && r.data.meta.frequency) || '';
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      if (!byFreq[freq]) byFreq[freq] = [];
      byFreq[freq].push({ row: r, time: t });
    });
    Object.keys(byFreq).forEach(function (freq) {
      byFreq[freq].sort(function (a, b) { return a.time - b.time; });
    });

    TABS.forEach(function (tab) {
      var entries = byFreq[tab.freq] || [];
      if (tab.slot === 1) entries = entries.filter(function (_, i) { return i % 2 === 0; });
      else if (tab.slot === 2) entries = entries.filter(function (_, i) { return i % 2 === 1; });

      entries.forEach(function (entry) {
        var r = entry.row, t = entry.time;
        recognizedIds[r.id] = true;
        // PENTING: zero/span1/span2 ada LANGSUNG di r.data (lihat collectData()
        // di cems_calibration.html) — TIDAK dibungkus r.data.calibration.
        // Field per parameter juga bernama exp/act (bukan expected/actual/dcs).
        // Sempat salah ambil dari r.data.calibration (yang tidak pernah ada),
        // jadi parser selalu return null untuk semua tag CEMS.
        var cal = r.data || {};
        var filledCount = 0;

        PARAMS.forEach(function (p) {
          var section = cal[p.section] || {};
          var row = section[p.key] || (p.fallbackKey ? section[p.fallbackKey] : null);
          if (!row) return;

          var actual = toNum(row.actual !== undefined ? row.actual : row.act);
          var exp = toNum(row.expected !== undefined ? row.expected : row.exp);
          var tagId = tab.prefix + '-' + p.suffix;
          var pt = { time: t, recordId: r.id, pic: r.pic };

          if (actual !== null) { result[tagId].Actual.push(Object.assign({ value: actual }, pt)); filledCount++; }
          if (exp !== null) { result[tagId].Expected.push(Object.assign({ value: exp }, pt)); filledCount++; }
        });

        debugRows.push({
          recordId: r.id, tanggal: r.tanggal, status: r.status, pic: r.pic,
          frequency: tab.freq, tab: tab.prefix, filledCount: filledCount, maxCount: PARAMS.length * 2
        });
      });
    });

    // Record yang frequency-nya TIDAK cocok satu pun dari 4 tab (mis. kosong,
    // salah ketik, atau "3-Monthly" yang memang belum ada tab-nya) — supaya
    // ketahuan, bukan cuma "hilang" diam-diam.
    (rows || []).forEach(function (r) {
      if (recognizedIds[r.id]) return;
      var freq = (r.data && r.data.meta && r.data.meta.frequency) || '(kosong)';
      debugRows.push({
        recordId: r.id, tanggal: r.tanggal, status: r.status, pic: r.pic,
        frequency: freq, tab: null, filledCount: 0, maxCount: PARAMS.length * 2
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
