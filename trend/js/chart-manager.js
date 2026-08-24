/**
 * ==========================================================================
 * CHART MANAGER — pembungkus Apache ECharts
 * ==========================================================================
 * MODE: COMBINED OVERLAY — semua tag yang dicentang (visible) tampil dalam
 * SATU grafik yang sama, mengikuti gaya trend recorder DCS/CEMS asli
 * (referensi: layar CEMS analyzer — beberapa channel ditumpuk dalam 1
 * grafik dengan sumbu Y "PER CENT SPAN" 0-100%, + panel nilai di sisi lain
 * yang mengikuti posisi cursor).
 *
 * Kenapa dinormalisasi ke % SPAN: tiap tag punya unit & rentang teknis
 * berbeda (ppm, °C, Bar, dst). Supaya semua bisa ditumpuk di 1 sumbu Y
 * tanpa saling menenggelamkan skala, tiap titik dikonversi jadi persentase
 * dari engineeringLow..engineeringHigh tag-nya. Nilai ASLI (dengan unit)
 * tetap dipakai penuh di tooltip dan di panel VALUES (lewat onCursorMove).
 *
 * GAP BREAK: data kalibrasi bersifat event-based (jarang, tidak reguler).
 * Kalau jarak antar 2 titik berturutan > DCS_CONFIG.GAP_BREAK_MINUTES,
 * garis DIPUTUS (disisipi titik null) supaya tidak terbaca seolah tren
 * proses kontinu padahal sebenarnya lompatan antar kejadian kalibrasi.
 * ==========================================================================
 */
(function () {
  'use strict';

  var chart = null;
  var lastSeriesMeta = []; // [{ name, color, unit, tagId, points:[{time,value}] (RAW, sudah gap-break-aware tapi tanpa null utk lookup) }]
  var cursorMoveCallback = null;
  var cursorLeaveCallback = null;

  function init(domEl) {
    if (typeof echarts === 'undefined') {
      console.error('[ChartManager] ECharts belum termuat. Cek koneksi CDN.');
      return false;
    }
    chart = echarts.init(domEl, null, { renderer: 'canvas' });
    window.addEventListener('resize', function () { if (chart) chart.resize(); });

    chart.on('updateAxisPointer', function (event) {
      var axisInfo = event.axesInfo && event.axesInfo[0];
      if (!axisInfo || axisInfo.value === undefined) return;
      handleCursorAt(axisInfo.value);
    });
    domEl.addEventListener('mouseleave', function () {
      if (cursorLeaveCallback) cursorLeaveCallback();
    });

    return true;
  }

  function timeFormatter(value) {
    var d = new Date(value);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function toPercentSpan(value, tag) {
    var lo = tag.engineeringLow != null ? tag.engineeringLow : 0;
    var hi = tag.engineeringHigh != null ? tag.engineeringHigh : 100;
    if (hi === lo) return 0;
    return ((value - lo) / (hi - lo)) * 100;
  }

  /** Cari nilai terdekat (<=time, fallback nearest) dari sebuah array point yang sudah terurut waktu. */
  function findNearest(points, time) {
    if (!points || !points.length) return null;
    if (time <= points[0].time) return points[0];
    if (time >= points[points.length - 1].time) return points[points.length - 1];
    // linear scan (jumlah titik historical wajar, tidak perlu binary search di Phase ini)
    for (var i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        var dLeft = time - points[i].time;
        var dRight = points[i + 1].time - time;
        return dLeft <= dRight ? points[i] : points[i + 1];
      }
    }
    return points[points.length - 1];
  }

  function handleCursorAt(time) {
    if (!cursorMoveCallback) return;
    var values = lastSeriesMeta.map(function (s) {
      var nearest = findNearest(s.points, time);
      return {
        name: s.name, color: s.color, unit: s.unit, tagId: s.tagId,
        value: nearest ? nearest.value : null,
        pointTime: nearest ? nearest.time : null
      };
    });
    cursorMoveCallback(time, values);
  }

  function onCursorMove(cb) { cursorMoveCallback = cb; }
  function onCursorLeave(cb) { cursorLeaveCallback = cb; }

  /** Nilai terkini (titik terakhir) tiap series — dipakai untuk state awal panel VALUES sebelum hover. */
  function getLatestValues() {
    return lastSeriesMeta.map(function (s) {
      var last = s.points.length ? s.points[s.points.length - 1] : null;
      return {
        name: s.name, color: s.color, unit: s.unit, tagId: s.tagId,
        value: last ? last.value : null,
        pointTime: last ? last.time : null
      };
    });
  }

  /**
   * Sisipkan titik null di antara 2 titik berturutan yang jaraknya melebihi
   * GAP_BREAK_MINUTES, supaya ECharts memutus garis (connectNulls:false).
   */
  function buildGapAwareData(points, tag) {
    var gapMs = (window.DCS_CONFIG.GAP_BREAK_MINUTES || 4320) * 60 * 1000;
    var out = [];
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      out.push([p.time, toPercentSpan(p.value, tag), p.value, tag.unit || '']);
      if (i < points.length - 1) {
        var gap = points[i + 1].time - p.time;
        if (gap > gapMs) {
          // sisipkan titik null tepat setelah titik ini -> memutus garis
          out.push([p.time + 1, null, null, tag.unit || '']);
        }
      }
    }
    return out;
  }

  /**
   * Render SEMUA tag yang visible=true dalam satu grafik overlay.
   * @param {Array} tags - array tag object dari TagManager (caller sudah filter visible)
   * @param {Object} seriesDataAll - { tagId: { seriesKey: [{time, value}] } }
   */
  function renderCombined(tags, seriesDataAll) {
    if (!chart) { console.error('[ChartManager] Chart belum di-init.'); return; }

    var echartSeries = [];
    lastSeriesMeta = [];

    (tags || []).forEach(function (tag) {
      var tagSeriesData = (seriesDataAll && seriesDataAll[tag.id]) || {};
      (tag.series || []).forEach(function (s) {
        var points = (tagSeriesData[s.key] || []).slice().sort(function (a, b) { return a.time - b.time; });
        var name = tag.id + ' · ' + s.label;

        lastSeriesMeta.push({ name: name, color: s.color, unit: tag.unit || '', tagId: tag.id, points: points });

        echartSeries.push({
          name: name,
          type: 'line',
          showSymbol: true,
          symbolSize: 5,
          smooth: false,
          connectNulls: false, // WAJIB false supaya gap-break di atas benar-benar memutus garis
          color: s.color,
          data: buildGapAwareData(points, tag)
        });
      });
    });

    var hasData = echartSeries.some(function (s) { return s.data.some(function (d) { return d[1] !== null; }); });

    var option = {
      backgroundColor: 'transparent',
      textStyle: { color: '#c7d3dc', fontFamily: "'Consolas','Courier New',monospace" },
      grid: { left: 65, right: 30, top: 50, bottom: 60 },
      title: {
        text: !tags.length ? 'CENTANG MINIMAL 1 TAG DI PANEL KIRI' : (!hasData ? 'TIDAK ADA DATA PADA RENTANG WAKTU INI' : ''),
        left: 'center', top: 'middle',
        textStyle: { color: '#5a6b76', fontSize: 13 }
      },
      legend: {
        top: 8, textStyle: { color: '#c7d3dc', fontSize: 10.5 }, type: 'scroll',
        data: echartSeries.map(function (s) { return s.name; })
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,16,20,0.95)',
        borderColor: '#2a3b44',
        textStyle: { color: '#e2ecf2', fontSize: 11 },
        axisPointer: { type: 'cross', label: { backgroundColor: '#1c2830' }, snap: true },
        formatter: function (params) {
          if (!params.length) return '';
          var visible = params.filter(function (p) { return p.value && p.value[1] !== null; });
          if (!visible.length) return '';
          var lines = ['<b>' + timeFormatter(visible[0].value[0]) + '</b>'];
          visible.forEach(function (p) {
            lines.push(p.marker + p.seriesName + ': <b>' + p.value[2] + ' ' + p.value[3] + '</b> (' + p.value[1].toFixed(1) + '% span)');
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
        name: 'PER CENT SPAN',
        nameLocation: 'middle',
        nameGap: 42,
        nameTextStyle: { color: '#8b9aa5' },
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#2a3b44' } },
        axisLabel: { color: '#8b9aa5', formatter: '{value}' },
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

  window.ChartManager = {
    init: init,
    renderCombined: renderCombined,
    autoScale: autoScale,
    resetZoom: resetZoom,
    exportImage: exportImage,
    onCursorMove: onCursorMove,
    onCursorLeave: onCursorLeave,
    getLatestValues: getLatestValues
  };
})();
