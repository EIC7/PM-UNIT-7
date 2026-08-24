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
   * Ambil record yang sudah difilter berdasarkan modul (mis. 'SO2'),
   * dan dalam rentang waktu [startTime, endTime] berdasarkan field
   * `updated_at` (fallback ke `tanggal` kalau updated_at kosong).
   */
  function fetchByModulAndRange(modulKey, startTime, endTime) {
    return fetchRecords().then(function (rows) {
      rows = rows || [];
      return rows.filter(function (r) {
        if (normalizeModul(r.modul) !== modulKey) return false;
        var t = recordTimestamp(r);
        if (t === null) return false;
        if (startTime && t < startTime) return false;
        if (endTime && t > endTime) return false;
        return true;
      });
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
