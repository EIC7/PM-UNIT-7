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
 * SUMBU Y — NILAI ASLI (bukan % span): selama semua tag yang tampil
 * berbagi unit yang sama (kasus SO2 sekarang: semua ppm, rentang 0-500),
 * sumbu Y langsung memakai nilai pengukuran asli — sesuai gaya tampilan
 * trend recorder DCS/CEMS asli (contoh referensi: layar Trend Display,
 * sumbu 0-500 ppm langsung, bukan dinormalisasi). Kalau nanti tag dengan
 * unit berbeda ditumpuk bersamaan, rentang sumbu jadi gabungan min/max
 * semua tag (lihat `renderCombined` — belum ada normalisasi ulang ke %,
 * jadi skala antar-unit berbeda bisa saling menenggelamkan; ini
 * trade-off yang disengaja demi keterbacaan angka asli untuk kasus
 * single-unit yang jadi prioritas saat ini).
 *
 * PINNED READOUT: klik di area grafik "menempelkan" kotak nilai +
 * garis vertikal ke titik data terdekat (persisten, tidak hilang saat
 * mouse dipindah — beda dari tooltip hover bawaan ECharts). Maks
 * `MAX_PINS` box sekaligus; klik ulang di waktu yang sama = lepas pin;
 * tombol × di kotak atau "CLEAR PINS" di toolbar = hapus.
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
  var GRID = { left: 65, right: 30, top: 50, bottom: 60 }; // dipakai bareng utk render pin graphics

  // ------------------------------------------------------------------
  // PINNED READOUT (klik di grafik utk "menempelkan" kotak nilai +
  // garis vertikal ke titik waktu tertentu, gaya PI ProcessBook /
  // contoh gambar user — persisten sampai ditutup, tidak hilang saat
  // mouse dipindah, beda dari tooltip hover biasa).
  // ------------------------------------------------------------------
  var pinnedTimes = [];
  var MAX_PINS = 4;

  function init(domEl) {
    if (typeof echarts === 'undefined') {
      console.error('[ChartManager] ECharts belum termuat. Cek koneksi CDN.');
      return false;
    }
    chart = echarts.init(domEl, null, { renderer: 'canvas' });
    window.addEventListener('resize', function () { if (chart) { chart.resize(); renderPinGraphics(); } });

    chart.on('updateAxisPointer', function (event) {
      var axisInfo = event.axesInfo && event.axesInfo[0];
      if (!axisInfo || axisInfo.value === undefined) return;
      handleCursorAt(axisInfo.value);
    });
    domEl.addEventListener('mouseleave', function () {
      if (cursorLeaveCallback) cursorLeaveCallback();
    });

    // Klik di area grafik = pin readout box di titik data terdekat.
    chart.getZr().on('click', function (event) {
      var pixelPoint = [event.offsetX, event.offsetY];
      if (!chart.containPixel({ gridIndex: 0 }, pixelPoint)) return;
      var dataPoint = chart.convertFromPixel({ xAxisIndex: 0 }, pixelPoint);
      var clickTime = Array.isArray(dataPoint) ? dataPoint[0] : dataPoint;
      var snapped = nearestGlobalTime(clickTime);
      if (snapped != null) addPin(snapped);
    });

    // Reposisi kotak pin saat zoom/geser (posisi pixel berubah walau waktu tetap).
    chart.on('dataZoom', function () { renderPinGraphics(); });

    return true;
  }

  function nearestGlobalTime(clickTime) {
    var best = null, bestDist = Infinity;
    lastSeriesMeta.forEach(function (s) {
      s.points.forEach(function (p) {
        var d = Math.abs(p.time - clickTime);
        if (d < bestDist) { bestDist = d; best = p.time; }
      });
    });
    return best;
  }

  function addPin(time) {
    // Kalau sudah ada pin persis di waktu itu, lepas (toggle) alih-alih dobel.
    var idx = pinnedTimes.indexOf(time);
    if (idx >= 0) { pinnedTimes.splice(idx, 1); renderPinGraphics(); return; }
    if (pinnedTimes.length >= MAX_PINS) pinnedTimes.shift(); // batasi biar tidak menumpuk penuh layar
    pinnedTimes.push(time);
    renderPinGraphics();
  }

  function removePin(time) {
    var idx = pinnedTimes.indexOf(time);
    if (idx >= 0) { pinnedTimes.splice(idx, 1); renderPinGraphics(); }
  }

  function clearPins() {
    pinnedTimes = [];
    renderPinGraphics();
  }

  function timeFormatterFull(value) {
    var d = new Date(value);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function renderPinGraphics() {
    if (!chart) return;
    var elements = [];
    var gridTop = GRID.top;
    var gridBottomPx = chart.getHeight() - GRID.bottom;

    pinnedTimes.slice().sort(function (a, b) { return a - b; }).forEach(function (time, pinIndex) {
      var xPixel = chart.convertToPixel({ xAxisIndex: 0 }, time);
      if (xPixel == null || isNaN(xPixel)) return;

      // garis vertikal putus-putus dari atas ke bawah area grafik
      elements.push({
        type: 'line', silent: true, z: 50,
        shape: { x1: xPixel, y1: gridTop, x2: xPixel, y2: gridBottomPx },
        style: { stroke: '#ffb400', lineWidth: 1, lineDash: [4, 3] }
      });

      // kumpulkan nilai tiap series pada waktu ini (nearest, biasanya persis sama)
      var rows = lastSeriesMeta.map(function (s) {
        var nearest = findNearest(s.points, time);
        return { name: s.name, color: s.color, unit: s.unit, value: nearest ? nearest.value : null };
      }).filter(function (r) { return r.value !== null; });

      var boxW = 168;
      var boxH = 20 + rows.length * 16;
      var boxX = xPixel + 8;
      // kalau box bakal kepotong di kanan, taruh di kiri garis
      var chartW = chart.getWidth();
      if (boxX + boxW > chartW - 4) boxX = xPixel - boxW - 8;
      var boxY = gridTop + 6 + pinIndex * (boxH + 6);

      var children = [
        { type: 'rect', shape: { x: 0, y: 0, width: boxW, height: boxH, r: 3 },
          style: { fill: 'rgba(10,16,20,0.95)', stroke: '#ffb400', lineWidth: 1 } },
        { type: 'text', style: { text: timeFormatterFull(time), x: 8, y: 6, fontSize: 10.5, fill: '#c7d3dc', fontFamily: "'Consolas','Courier New',monospace" } },
        { type: 'text', style: { text: '\u00D7', x: boxW - 16, y: 4, fontSize: 13, fill: '#8b9aa5', fontFamily: 'sans-serif' },
          cursor: 'pointer', onclick: (function (t) { return function () { removePin(t); }; })(time) }
      ];
      rows.forEach(function (r, i) {
        var rowY = 22 + i * 16;
        children.push({ type: 'circle', shape: { cx: 12, cy: rowY + 5, r: 4 }, style: { fill: r.color } });
        children.push({ type: 'text', style: {
          text: r.value.toFixed(2) + ' ' + (r.unit || ''), x: 22, y: rowY, fontSize: 11,
          fill: '#e2ecf2', fontFamily: "'Consolas','Courier New',monospace"
        } });
      });

      elements.push({ type: 'group', x: boxX, y: boxY, z: 51, children: children });
    });

    chart.setOption({ graphic: { elements: elements } }, { replaceMerge: ['graphic'] });
  }

  function timeFormatter(value) {
    var d = new Date(value);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
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
      out.push([p.time, p.value, tag.unit || '']);
      if (i < points.length - 1) {
        var gap = points[i + 1].time - p.time;
        if (gap > gapMs) {
          // sisipkan titik null tepat setelah titik ini -> memutus garis
          out.push([p.time + 1, null, tag.unit || '']);
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

    pinnedTimes = []; // data/tag berganti -> pin lama sudah tidak relevan

    var echartSeries = [];
    var legendSelected = {}; // name -> boolean, dari s.defaultVisible (default true kalau tidak diset)
    lastSeriesMeta = [];

    // Sumbu Y: nilai ASLI (ppm), bukan % span — dipakai selama semua tag
    // yang tampil berbagi unit & rentang yang sama (kasus SO2 sekarang).
    // Kalau nanti tag dg unit beda ikut ditumpuk, fallback ke rentang gabungan.
    var yUnit = (tags && tags[0] && tags[0].unit) || '';
    var yMin = 0, yMax = 100;
    if (tags && tags.length) {
      yMin = Math.min.apply(null, tags.map(function (t) { return t.min != null ? t.min : 0; }));
      yMax = Math.max.apply(null, tags.map(function (t) { return t.max != null ? t.max : 100; }));
    }
    var sameUnit = tags && tags.length && tags.every(function (t) { return (t.unit || '') === yUnit; });

    (tags || []).forEach(function (tag) {
      var tagSeriesData = (seriesDataAll && seriesDataAll[tag.id]) || {};
      (tag.series || []).forEach(function (s) {
        var points = (tagSeriesData[s.key] || []).slice().sort(function (a, b) { return a.time - b.time; });
        var name = tag.id + ' · ' + s.label;
        legendSelected[name] = s.defaultVisible !== false;

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
      grid: GRID,
      title: {
        text: !tags.length ? 'CENTANG MINIMAL 1 TAG DI PANEL KIRI' : (!hasData ? 'TIDAK ADA DATA PADA RENTANG WAKTU INI' : ''),
        left: 'center', top: 'middle',
        textStyle: { color: '#5a6b76', fontSize: 13 }
      },
      legend: {
        top: 8, textStyle: { color: '#c7d3dc', fontSize: 10.5 }, type: 'scroll',
        data: echartSeries.map(function (s) { return s.name; }),
        selected: legendSelected
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
            lines.push(p.marker + p.seriesName + ': <b>' + p.value[1] + ' ' + p.value[2] + '</b>');
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
        name: sameUnit && yUnit ? yUnit.toUpperCase() : 'VALUE',
        nameLocation: 'middle',
        nameGap: 42,
        nameTextStyle: { color: '#8b9aa5' },
        min: yMin,
        max: yMax,
        axisLine: { lineStyle: { color: '#2a3b44' } },
        axisLabel: { color: '#8b9aa5', formatter: '{value}' },
        splitLine: { show: true, lineStyle: { color: '#1c2830' } }
      },
      dataZoom: [
        { type: 'inside', throttle: 50 },
        { type: 'slider', height: 18, bottom: 12, borderColor: '#2a3b44', fillerColor: 'rgba(0,217,255,0.1)', handleStyle: { color: '#00d9ff' }, textStyle: { color: '#8b9aa5' } }
      ],
      graphic: { elements: [] },
      series: echartSeries
    };

    chart.setOption(option, true);
    renderPinGraphics();
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

  /* ------------------------------------------------------------------ */
  // Chart mini untuk panel deviasi (dipakai module-view.js). Tiap panel
  // punya instance ECharts sendiri, disimpan di sini supaya bisa di-resize
  // ulang tanpa dibuat baru terus-menerus tiap render.
  var deviationCharts = {};

  function renderDeviationChart(domId, points, pairCfg) {
    if (typeof echarts === 'undefined') return;
    var domEl = document.getElementById(domId);
    if (!domEl) return;

    var inst = deviationCharts[domId];
    if (!inst) {
      inst = echarts.init(domEl, null, { renderer: 'canvas' });
      deviationCharts[domId] = inst;
      window.addEventListener('resize', function () { inst.resize(); });
    }

    var tol = pairCfg.toleranceValue;
    var markArea = tol != null ? {
      silent: true,
      itemStyle: { color: 'rgba(57,255,136,0.08)' },
      data: [[{ yAxis: -tol }, { yAxis: tol }]]
    } : undefined;

    var data = points.map(function (p) {
      var out = { value: [p.time, p.value] };
      if (tol != null && Math.abs(p.value) > tol) {
        out.itemStyle = { color: '#ff5e7a' }; // tandai titik yang keluar toleransi
      }
      return out;
    });

    inst.setOption({
      backgroundColor: 'transparent',
      textStyle: { color: '#c7d3dc', fontFamily: "'Consolas','Courier New',monospace" },
      grid: { left: 50, right: 20, top: 16, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,16,20,0.95)',
        borderColor: '#2a3b44',
        textStyle: { color: '#e2ecf2', fontSize: 11 },
        formatter: function (params) {
          if (!params.length) return '';
          var p = params[0];
          return timeFormatter(p.value[0]) + '<br/>' + pairCfg.label + ': <b>' + p.value[1].toFixed(2) + ' ' + (pairCfg.unit || '') + '</b>';
        }
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#2a3b44' } },
        axisLabel: { color: '#8b9aa5', fontSize: 10, formatter: timeFormatter },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#2a3b44' } },
        axisLabel: { color: '#8b9aa5', fontSize: 10 },
        splitLine: { show: true, lineStyle: { color: '#1c2830' } }
      },
      series: [{
        type: 'line',
        showSymbol: true,
        symbolSize: 5,
        color: '#00d9ff',
        markArea: markArea,
        markLine: { silent: true, symbol: 'none', lineStyle: { color: '#5a6b76', type: 'dashed' }, data: [{ yAxis: 0 }] },
        data: data
      }]
    }, true);
  }

  window.ChartManager = {
    init: init,
    renderCombined: renderCombined,
    renderDeviationChart: renderDeviationChart,
    autoScale: autoScale,
    resetZoom: resetZoom,
    exportImage: exportImage,
    onCursorMove: onCursorMove,
    onCursorLeave: onCursorLeave,
    getLatestValues: getLatestValues,
    clearPins: clearPins
  };
})();
