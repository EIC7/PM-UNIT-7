/**
 * ==========================================================================
 * CHART MANAGER — pembungkus Apache ECharts
 * ==========================================================================
 * Satu instance chart untuk Historical Trend. Render ulang HANYA saat data
 * berubah (bukan tiap frame) — sesuai catatan performa di spec (jangan
 * memanggil chart.setOption() berlebihan).
 * ==========================================================================
 */
(function () {
  'use strict';

  var chart = null;
  var currentTagId = null;

  function init(domEl) {
    if (typeof echarts === 'undefined') {
      console.error('[ChartManager] ECharts belum termuat. Cek koneksi CDN.');
      return false;
    }
    chart = echarts.init(domEl, null, { renderer: 'canvas' });
    window.addEventListener('resize', function () { if (chart) chart.resize(); });
    return true;
  }

  function timeFormatter(value) {
    var d = new Date(value);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /**
   * Render historical trend untuk 1 tag (bisa multi-series, mis. DCS vs Local).
   * @param {Object} tag - tag metadata dari TagManager
   * @param {Object} seriesData - { seriesKey: [{time, value}] }
   */
  function renderHistoricalTag(tag, seriesData) {
    if (!chart) { console.error('[ChartManager] Chart belum di-init.'); return; }
    currentTagId = tag.id;

    var echartSeries = (tag.series || []).map(function (s) {
      var points = (seriesData && seriesData[s.key]) || [];
      return {
        name: s.label,
        type: 'line',
        showSymbol: true,
        symbolSize: 6,
        smooth: false,
        color: s.color,
        data: points.map(function (p) { return [p.time, p.value]; }),
        markLine: null
      };
    });

    var hasData = echartSeries.some(function (s) { return s.data.length > 0; });

    var option = {
      backgroundColor: 'transparent',
      textStyle: { color: '#c7d3dc', fontFamily: "'Consolas','Courier New',monospace" },
      grid: { left: 60, right: 30, top: 50, bottom: 60 },
      title: {
        text: hasData ? '' : 'TIDAK ADA DATA PADA RENTANG WAKTU INI',
        left: 'center', top: 'middle',
        textStyle: { color: '#5a6b76', fontSize: 13 }
      },
      legend: {
        top: 8, textStyle: { color: '#c7d3dc', fontSize: 11 },
        data: echartSeries.map(function (s) { return s.name; })
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,16,20,0.95)',
        borderColor: '#2a3b44',
        textStyle: { color: '#e2ecf2', fontSize: 11 },
        axisPointer: { type: 'cross', label: { backgroundColor: '#1c2830' } },
        formatter: function (params) {
          if (!params.length) return '';
          var lines = ['<b>' + timeFormatter(params[0].value[0]) + '</b>'];
          params.forEach(function (p) {
            lines.push(p.marker + p.seriesName + ': <b>' + p.value[1] + ' ' + (tag.unit || '') + '</b>');
          });
          return lines.join('<br/>');
        }
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#2a3b44' } },
        axisLabel: { color: '#8b9aa5', formatter: timeFormatter },
        splitLine: { show: true, lineStyle: { color: '#1c2830' } }
      },
      yAxis: {
        type: 'value',
        name: tag.unit || '',
        nameTextStyle: { color: '#8b9aa5' },
        min: tag.engineeringLow != null ? tag.engineeringLow : null,
        max: tag.engineeringHigh != null ? tag.engineeringHigh : null,
        axisLine: { lineStyle: { color: '#2a3b44' } },
        axisLabel: { color: '#8b9aa5' },
        splitLine: { show: true, lineStyle: { color: '#1c2830' } }
      },
      dataZoom: [
        { type: 'inside', throttle: 50 },
        { type: 'slider', height: 18, bottom: 12, borderColor: '#2a3b44', fillerColor: 'rgba(0,217,255,0.1)', handleStyle: { color: '#00d9ff' }, textStyle: { color: '#8b9aa5' } }
      ],
      series: echartSeries
    };

    chart.setOption(option, true);
  }

  function autoScale() {
    if (!chart) return;
    chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
  }

  function resetZoom() { autoScale(); }

  function exportImage(filename) {
    if (!chart) return;
    var url = chart.getDataURL({ type: 'png', backgroundColor: '#0a1014' });
    var a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'trend') + '.png';
    a.click();
  }

  function getCurrentTagId() { return currentTagId; }

  window.ChartManager = {
    init: init,
    renderHistoricalTag: renderHistoricalTag,
    autoScale: autoScale,
    resetZoom: resetZoom,
    exportImage: exportImage,
    getCurrentTagId: getCurrentTagId
  };
})();
