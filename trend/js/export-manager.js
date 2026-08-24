/**
 * ==========================================================================
 * EXPORT MANAGER — EXPORT CSV / JSON
 * ==========================================================================
 */
(function () {
  'use strict';

  function downloadBlob(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(t) {
    var d = new Date(t);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  /** Export 1 tag saja (dipertahankan untuk kompatibilitas API). */
  function exportTag(tagId, format) {
    return exportTags([tagId], format);
  }

  /**
   * Export SATU ATAU LEBIH tag sekaligus (mode overlay), digabung jadi satu
   * file — CSV: 1 tabel dengan kolom "TAGID · SeriesLabel" per timestamp
   * unik gabungan. JSON: object per tag.
   */
  function exportTags(tagIds, format) {
    if (!tagIds || !tagIds.length) { console.warn('[ExportManager] Tidak ada tag untuk di-export.'); return; }

    var bundle = {}; // tagId -> { tag, series }
    tagIds.forEach(function (tagId) {
      var tag = window.TagManager.getTag(tagId);
      var series = window.DCSTrend.getHistoricalData(tagId);
      if (tag && series) bundle[tagId] = { tag: tag, series: series };
    });

    if (!Object.keys(bundle).length) { console.warn('[ExportManager] Belum ada data historical untuk tag terpilih.'); return; }

    var filenameBase = tagIds.length === 1 ? tagIds[0] : 'dcs_trend_multi';

    if (format === 'json') {
      var jsonOut = {};
      Object.keys(bundle).forEach(function (tagId) {
        jsonOut[tagId] = { name: bundle[tagId].tag.name, series: bundle[tagId].series };
      });
      downloadBlob(JSON.stringify(jsonOut, null, 2), filenameBase + '_export.json', 'application/json');
      return;
    }

    // Default: CSV — kolom = "TAGID · SeriesLabel" gabungan semua tag, baris = timestamp unik gabungan
    var columns = []; // [{ colKey, tagId, seriesKey, label }]
    Object.keys(bundle).forEach(function (tagId) {
      var tag = bundle[tagId].tag;
      (tag.series || []).forEach(function (s) {
        columns.push({ colKey: tagId + ' · ' + s.label, tagId: tagId, seriesKey: s.key });
      });
    });

    var timeSet = {};
    columns.forEach(function (c) {
      (bundle[c.tagId].series[c.seriesKey] || []).forEach(function (p) { timeSet[p.time] = true; });
    });
    var times = Object.keys(timeSet).map(Number).sort(function (a, b) { return a - b; });

    var lookup = {}; // colKey -> { time: value }
    columns.forEach(function (c) {
      lookup[c.colKey] = {};
      (bundle[c.tagId].series[c.seriesKey] || []).forEach(function (p) { lookup[c.colKey][p.time] = p.value; });
    });

    var header = 'Timestamp,' + columns.map(function (c) { return c.colKey; }).join(',');
    var lines = [header];
    times.forEach(function (t) {
      var row = [fmtTime(t)];
      columns.forEach(function (c) {
        row.push(lookup[c.colKey][t] !== undefined ? lookup[c.colKey][t] : '');
      });
      lines.push(row.join(','));
    });

    downloadBlob(lines.join('\n'), filenameBase + '_export.csv', 'text/csv');
  }

  window.ExportManager = { exportTag: exportTag, exportTags: exportTags };
})();
