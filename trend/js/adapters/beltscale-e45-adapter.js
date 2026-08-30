/**
 * ==========================================================================
 * BELT CONVEYOR E4-E5 ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Sumber: beltscale-e45.html (modul Supabase 'BELT CONVEYOR E4-E5').
 * Struktur data.checks di record (lihat beltscale-e45.html:dbCollectData):
 *   checks[idx] = {a, b} — idx 0-based mengikuti posisi array BS_CHECKS.
 * HANYA 3 item BS_CHECKS yang type:'input' (bukan checkbox) dan menyimpan
 * ANGKA sungguhan: idx 6 (no:'6a' Error Zero Calibration %), idx 7
 * (no:'6b' New Zero Change Value), idx 8 (no:'6c' Old Zero Change Value).
 * Sisanya (idx 0-4, 9-10) checkbox PTW/cleaning/dst — tidak relevan untuk
 * trend numerik, sengaja tidak ditarik.
 * side 'a' = Conveyor E-4 (tag CCH-SCAL-800A, Panel E4), side 'b' =
 * Conveyor E-5 (tag CCH-SCAL-800B, Panel E5) — lihat objek BS_KEY di
 * source (a:{code:'CCH-SCAL-800A',name:'CONVEYOR E-4'}, b:{code:'CCH-SCAL-800B',...}).
 *
 * 2026-08-30: dipecah dari 2 tag (A/B, tiap tag 3 series campur) jadi 4 tag
 * SEMPIT (A-ERRORZERO/B-ERRORZERO/A-VALUE/B-VALUE) supaya bisa dikelompokkan
 * jadi 3 tab trend terpisah ("Error Zero", "Beltscale A Value", "Beltscale
 * B Value" — lihat config/modules/beltscale-e45.config.js) — pola yang sama
 * dipakai FEGT+LD (1 adapter, banyak DCS_MODULES entry berbagi pool tag yang
 * sama). Nilai mentah & field mapping TIDAK berubah, cuma dipetakan ke tag
 * ID yang lebih sempit.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var cleaned = String(v).replace(/[^0-9.\-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
    var n = Number(cleaned);
    return isNaN(n) ? null : n;
  }

  var FIELD_IDX = { ErrorZeroCal: '6', NewZeroChange: '7', OldZeroChange: '8' };
  // tag ID sempit -> {side, seriesKeys yang masuk tag itu}
  var TAG_MAP = {
    'BELTSCALE-E45-A-ERRORZERO': { side: 'a', series: ['ErrorZeroCal'] },
    'BELTSCALE-E45-B-ERRORZERO': { side: 'b', series: ['ErrorZeroCal'] },
    'BELTSCALE-E45-A-VALUE':     { side: 'a', series: ['NewZeroChange', 'OldZeroChange'] },
    'BELTSCALE-E45-B-VALUE':     { side: 'b', series: ['NewZeroChange', 'OldZeroChange'] }
  };
  var SERIES_KEYS = ['ErrorZeroCal', 'NewZeroChange', 'OldZeroChange'];

  function parseRecords(rows) {
    var result = {};
    Object.keys(TAG_MAP).forEach(function (tagId) {
      var obj = {};
      TAG_MAP[tagId].series.forEach(function (sk) { obj[sk] = []; });
      result[tagId] = obj;
    });

    (rows || []).forEach(function (r) {
      var checks = (r.data && r.data.checks) || {};
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;

      Object.keys(TAG_MAP).forEach(function (tagId) {
        var cfg = TAG_MAP[tagId];
        cfg.series.forEach(function (sk) {
          var entry = checks[FIELD_IDX[sk]];
          var raw = entry ? entry[cfg.side] : null;
          var val = toNumber(raw);
          if (val !== null) {
            result[tagId][sk].push({ time: t, value: val, recordId: r.id, pic: r.pic });
          }
        });
      });
    });

    Object.keys(result).forEach(function (tagId) {
      Object.keys(result[tagId]).forEach(function (seriesKey) {
        result[tagId][seriesKey].sort(function (p1, p2) { return p1.time - p2.time; });
      });
    });

    return result;
  }

  window.BeltscaleE45Adapter = {
    modulKey: 'BELT CONVEYOR E4-E5',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['BELT CONVEYOR E4-E5'] = window.BeltscaleE45Adapter;
})();
