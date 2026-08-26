/**
 * ==========================================================================
 * FEGT + LD ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'FEGT & Leak Detection', dari
 * fegt.html:dbCollectData) menjadi titik-titik historical trend.
 *
 * SATU form fegt.html menyimpan DUA kelompok data fisik berbeda dalam SATU
 * record yang sama:
 *   - data.paths     : 21 titik acoustic pyrometry (FEGT — suhu gas keluar
 *                       furnace, tiap titik = 1 lintasan sinyal TX->RX)
 *                       { id, temp, status }
 *   - data.leakPaths  : 10 titik leak detection (LD — suhu lokal di area
 *                       rawan bocor: superheater, reheater, economizer,
 *                       bottom slope) { id, temp, status }
 *
 * Karena SATU query Supabase (modul='FEGT & Leak Detection') sudah membawa
 * KEDUA kelompok itu sekaligus, adapter ini cukup SATU file yang parsing
 * keduanya jadi tag terpisah (FEGT-P1..21 dan LD-1..10) — historical-
 * manager.js cuma butuh 1 modulKey ('FEGT') untuk fetch semuanya sekaligus.
 * Pemisahan visual FEGT vs LD (2 grafik/tab terpisah) diatur di
 * config/modules/fegt.config.js + config/modules/ld.config.js — BUKAN di
 * sini, karena keduanya baca dari state.lastLoadedSeries yang sama.
 *
 * CATATAN ENGINEERING RANGE: source form (fegt.html) TIDAK mendefinisikan
 * batas alarm/rentang instrumen eksplisit — status "ok"/"data fail" cuma
 * berdasarkan `temp > 0` (bacaan valid atau tidak), bukan ambang proses.
 * Nilai min/max/chartMax di config/default-tags-fegt.js karena itu memakai
 * ASUMSI rentang tipikal FEGT boiler batubara (~900-1300°C) dan LD
 * (~0-600°C) — sesuaikan kalau ada angka aktual dari instrumen.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var FEGT_PATH_COUNT = 21;
  var LD_POINT_COUNT = 10;

  /**
   * @param {Array} rows - hasil SupabaseAdapter.fetchByModulAndRange('FEGT', ...)
   * @returns {Object} map tagId -> { Temp: [{ time, value, recordId, pic, status }] }
   *
   * CATATAN: fegt.html menyimpan sampai 36 slot foto base64 (cleaning-hole
   * FEGT 8 titik + LD 10 titik, before/after) di data.cleaning/data.cleaningLd
   * -- kalau di-select penuh, 500 baris x 90 hari bisa ratusan MB dan
   * fetch() gagal ("Failed to fetch") terutama di jaringan mobile. Makanya
   * selectColumns di bawah PAKAI SINTAKS POSTGREST alias:kolom->key untuk
   * HANYA ambil data.paths & data.leakPaths (angka suhu doang, kecil),
   * skip field foto sama sekali. Efeknya: baris hasil query jadi punya
   * r.paths / r.leakPaths LANGSUNG di top-level (BUKAN r.data.paths lagi),
   * makanya parser di bawah baca r.paths, bukan (r.data||{}).paths.
   */
  function parseFegtLdRecords(rows) {
    var result = {};
    for (var i = 1; i <= FEGT_PATH_COUNT; i++) result['FEGT-P' + i] = { Temp: [] };
    for (var j = 1; j <= LD_POINT_COUNT; j++) result['LD-' + j] = { Temp: [] };

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      (r.paths || []).forEach(function (p) {
        var val = toNumber(p.temp);
        var tagId = 'FEGT-P' + p.id;
        if (val !== null && val > 0 && result[tagId]) {
          // temp<=0 dianggap "data fail" oleh form asal (lihat catatan di atas) -> bukan bacaan proses valid, jangan ikut di-plot
          result[tagId].Temp.push({ time: t, value: val, recordId: r.id, pic: r.pic, status: p.status });
        }
      });

      (r.leakPaths || []).forEach(function (p) {
        var val = toNumber(p.temp);
        var tagId = 'LD-' + p.id;
        if (val !== null && val > 0 && result[tagId]) {
          result[tagId].Temp.push({ time: t, value: val, recordId: r.id, pic: r.pic, status: p.status });
        }
      });
    });

    Object.keys(result).forEach(function (tagId) {
      result[tagId].Temp.sort(function (p1, p2) { return p1.time - p2.time; });
    });

    return result;
  }

  window.FegtLdAdapter = {
    modulKey: 'FEGT',
    seriesKeys: ['Temp'],
    selectColumns: 'id,modul,tanggal,pic,work_order,unit,created_at,updated_at,paths:data->paths,leakPaths:data->leakPaths',
    parseRecords: parseFegtLdRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['FEGT'] = window.FegtLdAdapter;
})();
