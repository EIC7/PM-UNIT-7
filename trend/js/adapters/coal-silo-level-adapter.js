/**
 * ==========================================================================
 * COAL SILO LEVEL TRANSMITTER ADAPTER — parser modul-spesifik
 * ==========================================================================
 * Mengubah baris mentah pm_records (modul 'Coal Silo Level Transmitter')
 * menjadi titik-titik historical trend siap-pakai untuk chart-manager.js.
 *
 * Struktur data di record (lihat coal-silo-level.html, dbCollectData() ->
 * data.steps):
 *   data.steps[idx][unitId] = {
 *     'csAF_<uid2>_<idx>': As Found (string angka),
 *     'csAL_<uid2>_<idx>': As Left (string angka),
 *     'csINSP_<uid2>_<idx>': single Inspection reading (string angka)
 *   }
 *   uid2 = unitId dengan '-' diganti '_' (mis. 'BF-LI-500A' -> 'BF_LI_500A')
 *   idx = index ARRAY (0-based) di CSL_STEPS milik coal-silo-level.html,
 *   BUKAN field `no` (yang isinya '6a'/'7a' dst) — lihat daftar MEASURE_STEPS
 *   di bawah, idx-nya sudah dicocokkan manual ke urutan array CSL_STEPS.
 *
 * Halaman punya 2 mode tab (csTabMode: 'calibration' pakai AF/AL,
 * 'inspection' pakai INSP tunggal) tapi KETIGA field selalu ada di DOM
 * (disimpan apa adanya walau kosong) — jadi di sini disederhanakan jadi
 * 2 series per step: "Read" (AF, fallback ke INSP kalau AF kosong) dan
 * "AsLeft" (AL) — analog pola Before/After di so2-adapter.js/
 * o2-inlet-adapter.js supaya bisa dipasangkan di deviationPairs.
 * 6 unit (BF-LI-500A..F) = 6 tag, tiap tag 14 step 'measure' x 2 series.
 * ==========================================================================
 */
(function () {
  'use strict';

  function toNum(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  var UNITS = ['BF-LI-500A', 'BF-LI-500B', 'BF-LI-500C', 'BF-LI-500D', 'BF-LI-500E', 'BF-LI-500F'];

  // idx = index array (0-based) langkah 'measure' di CSL_STEPS milik coal-silo-level.html
  var MEASURE_STEPS = [
    { idx: 5,  slug: 'DCSReading' },
    { idx: 6,  slug: 'OmronReading' },
    { idx: 7,  slug: 'ScalePointInputA1' },
    { idx: 8,  slug: 'ScalePointInputA2' },
    { idx: 9,  slug: 'ScalePointDisplayA1' },
    { idx: 10, slug: 'ScalePointDisplayA2' },
    { idx: 11, slug: 'LoadCell1Voltage' },
    { idx: 12, slug: 'LoadCell1Output' },
    { idx: 13, slug: 'LoadCell2Voltage' },
    { idx: 14, slug: 'LoadCell2Output' },
    { idx: 15, slug: 'LoadCell3Voltage' },
    { idx: 16, slug: 'LoadCell3Output' },
    { idx: 17, slug: 'LoadCell4Voltage' },
    { idx: 18, slug: 'LoadCell4Output' }
  ];

  function seriesKeysForStep(step) {
    return [step.slug, step.slug + 'AsLeft'];
  }

  var SERIES_KEYS = [];
  MEASURE_STEPS.forEach(function (s) { SERIES_KEYS = SERIES_KEYS.concat(seriesKeysForStep(s)); });

  function tagId(unitId) { return 'CSL-' + unitId; }

  function makeEmptyResult() {
    var result = {};
    UNITS.forEach(function (u) {
      var obj = {};
      SERIES_KEYS.forEach(function (k) { obj[k] = []; });
      result[tagId(u)] = obj;
    });
    return result;
  }

  function parseCoalSiloLevelRecords(rows) {
    var result = makeEmptyResult();

    (rows || []).forEach(function (r) {
      var t = window.SupabaseAdapter.recordTimestamp(r);
      if (t === null) return;
      var steps = (r.data && r.data.steps) || {};

      UNITS.forEach(function (unitId) {
        var uid2 = unitId.replace(/-/g, '_');
        var id = tagId(unitId);

        MEASURE_STEPS.forEach(function (step) {
          var cell = (steps[step.idx] && steps[step.idx][unitId]) || null;
          if (!cell) return;
          var af = toNum(cell['csAF_' + uid2 + '_' + step.idx]);
          var al = toNum(cell['csAL_' + uid2 + '_' + step.idx]);
          var insp = toNum(cell['csINSP_' + uid2 + '_' + step.idx]);
          var readVal = af !== null ? af : insp;

          if (readVal !== null) result[id][step.slug].push({ time: t, value: readVal, recordId: r.id, pic: r.pic });
          if (al !== null) result[id][step.slug + 'AsLeft'].push({ time: t, value: al, recordId: r.id, pic: r.pic });
        });
      });
    });

    Object.keys(result).forEach(function (id) {
      Object.keys(result[id]).forEach(function (sk) {
        result[id][sk].sort(function (a, b) { return a.time - b.time; });
      });
    });

    return result;
  }

  window.CoalSiloLevelAdapter = {
    modulKey: 'Coal Silo Level Transmitter',
    seriesKeys: SERIES_KEYS,
    parseRecords: parseCoalSiloLevelRecords
  };

  window.DCS_ADAPTERS = window.DCS_ADAPTERS || {};
  window.DCS_ADAPTERS['Coal Silo Level Transmitter'] = window.CoalSiloLevelAdapter;
})();
