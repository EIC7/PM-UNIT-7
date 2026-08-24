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

  function exportTag(tagId, format) {
    var tag = window.TagManager.getTag(tagId);
    if (!tag) { console.error('[ExportManager] Tag tidak ditemukan:', tagId); return; }
    var series = window.DCSTrend.getHistoricalData(tagId);
    if (!series) { console.warn('[ExportManager] Belum ada data historical untuk tag ini.'); return; }

    if (format === 'json') {
      downloadBlob(JSON.stringify({ tag: tag.id, name: tag.name, series: series }, null, 2),
        tag.id + '_export.json', 'application/json');
      return;
    }

    // Default: CSV — gabungkan seluruh seri jadi satu tabel per timestamp unik
    var seriesKeys = Object.keys(series);
    var timeSet = {};
    seriesKeys.forEach(function (k) {
      series[k].forEach(function (p) { timeSet[p.time] = true; });
    });
    var times = Object.keys(timeSet).map(Number).sort(function (a, b) { return a - b; });

    var lookup = {};
    seriesKeys.forEach(function (k) {
      lookup[k] = {};
      series[k].forEach(function (p) { lookup[k][p.time] = p.value; });
    });

    var header = 'Timestamp,' + seriesKeys.join(',');
    var lines = [header];
    times.forEach(function (t) {
      var row = [fmtTime(t)];
      seriesKeys.forEach(function (k) {
        row.push(lookup[k][t] !== undefined ? lookup[k][t] : '');
      });
      lines.push(row.join(','));
    });

    downloadBlob(lines.join('\n'), tag.id + '_export.csv', 'text/csv');
  }

  window.ExportManager = { exportTag: exportTag };
})();
