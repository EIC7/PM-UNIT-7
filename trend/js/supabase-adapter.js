/**
 * ==========================================================================
 * SUPABASE ADAPTER — READ-ONLY
 * ==========================================================================
 * Fetch record dari tabel `pm_records` (project Supabase yang sama dengan
 * repo Mahfudjtf/PM-UNIT-7). Modul ini SENGAJA hanya mengimplementasikan
 * GET — tidak ada create/update/delete — karena Trend System hanya
 * membaca hasil PM/kalibrasi, bukan mengubahnya.
 *
 * Bagian dari arsitektur DataManager (lihat 20. SYSTEM ARCHITECTURE):
 *   DataManager -> APIAdapter  (di project awal disebut begitu; di sini
 *   diimplementasikan sebagai SupabaseAdapter karena itulah backend nyata
 *   yang dipakai).
 * ==========================================================================
 */
(function () {
  'use strict';

  var CFG = window.DCS_CONFIG.SUPABASE;

  function buildHeaders() {
    return {
      'apikey': CFG.ANON_KEY,
      'Authorization': 'Bearer ' + CFG.ANON_KEY,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Ambil seluruh record pm_records (dibatasi FETCH_LIMIT), terbaru dulu.
   * Tidak filter modul di query (Supabase REST filter `ilike` cukup ribet
   * untuk beberapa alias modul) — filter modul dilakukan di client lewat
   * normalizeModul(), sama seperti pola di shared.js repo asal.
   */
  function fetchRecords() {
    var url = CFG.URL + '/rest/v1/' + CFG.TABLE +
      '?select=' + encodeURIComponent(CFG.SELECT_COLUMNS) +
      '&order=updated_at.desc&limit=' + CFG.FETCH_LIMIT;

    return fetch(url, { method: 'GET', headers: buildHeaders() })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            throw new Error('Supabase GET gagal (' + res.status + '): ' + t);
          });
        }
        return res.json();
      })
      .catch(function (err) {
        console.error('[SupabaseAdapter] fetchRecords error:', err);
        throw err;
      });
  }

  /** Normalisasi nama modul supaya varian penulisan tetap cocok. */
  function normalizeModul(name) {
    if (!name) return '';
    var n = String(name).toUpperCase();
    if (n.indexOf('SO2') >= 0 || n.indexOf('SCRUBBER') >= 0) return 'SO2';
    return n;
  }

  /**
   * Ambil record `pm_records` untuk 1 modul spesifik + rentang waktu,
   * DIFILTER DI QUERY (server-side), bukan fetch-semua-lalu-filter-client.
   *
   * Kenapa ini penting (§8.2 Trend Fitur.MD, temuan #6, prioritas 🔴 Tinggi):
   * pm_records dipakai bersama oleh ~15 modul lain (Opacity, CEMS, Coal
   * Feeder, Belt Scale, FEGT, dst). Kalau query cuma "500 record TERBARU
   * dari SELURUH tabel lalu filter client", modul yang jarang diisi (SO2)
   * gampang terlempar keluar dari 500-record window itu oleh modul lain
   * yang lebih sering menyimpan — hasilnya "TIDAK ADA DATA" padahal data
   * SO2 sebenarnya ADA di database, cuma tidak pernah ikut ter-fetch.
   *
   * Field `modul` di DB berisi teks bebas per form (mis. so2.html menyimpan
   * 'SO2 Scrubber Inlet', bukan cuma 'SO2') — makanya di sini pakai
   * `ilike.*<modulKey>*` (substring match, case-insensitive) via PostgREST,
   * bukan `eq` (exact match).
   *
   * @param {string} [selectColumnsOverride] - kalau modul sumbernya
   *   menyimpan payload BESAR di kolom `data` (mis. fegt.html embed sampai
   *   36 slot foto base64 untuk cleaning-hole di data.cleaning/data.cleaningLd),
   *   fetch `select=...,data,...` penuh bisa jadi ratusan MB untuk 500 baris
   *   x 90 hari -> gagal ("Failed to fetch") terutama di jaringan mobile.
   *   Adapter modul itu bisa override select-nya untuk HANYA ambil sub-path
   *   JSON yang benar-benar dipakai trend (mis. 'paths:data->paths,
   *   leakPaths:data->leakPaths'), lewat sintaks PostgREST alias:col->key,
   *   skip field foto sama sekali. Kalau tidak di-override, pakai
   *   CFG.SELECT_COLUMNS default (select seluruh kolom `data`).
   */
  function fetchByModulAndRange(modulKey, startTime, endTime, selectColumnsOverride) {
    var selectCols = selectColumnsOverride || CFG.SELECT_COLUMNS;
    var url = CFG.URL + '/rest/v1/' + CFG.TABLE +
      '?select=' + encodeURIComponent(selectCols) +
      '&modul=ilike.*' + encodeURIComponent(modulKey) + '*' +
      '&order=updated_at.desc&limit=' + CFG.FETCH_LIMIT;

    return fetch(url, { method: 'GET', headers: buildHeaders() })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            throw new Error('Supabase GET gagal (' + res.status + '): ' + t);
          });
        }
        return res.json();
      })
      .then(function (rows) {
        rows = rows || [];
        // Filter rentang waktu tetap di client (updated_at bisa null utk
        // sebagian record lama -> fallback created_at/tanggal di recordTimestamp,
        // yang tidak bisa direpresentasikan sebagai 1 kondisi query PostgREST).
        return rows.filter(function (r) {
          var t = recordTimestamp(r);
          if (t === null) return false;
          if (startTime && t < startTime) return false;
          if (endTime && t > endTime) return false;
          return true;
        });
      })
      .catch(function (err) {
        console.error('[SupabaseAdapter] fetchByModulAndRange error:', err);
        throw err;
      });
  }

  function recordTimestamp(r) {
    var raw = r.updated_at || r.created_at || r.tanggal;
    if (!raw) return null;
    var t = new Date(raw).getTime();
    return isNaN(t) ? null : t;
  }

  window.SupabaseAdapter = {
    fetchRecords: fetchRecords,
    fetchByModulAndRange: fetchByModulAndRange,
    normalizeModul: normalizeModul,
    recordTimestamp: recordTimestamp
  };
})();
