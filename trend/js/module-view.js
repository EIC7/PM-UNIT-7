/**
 * ==========================================================================
 * MODULE VIEW — mesin generik tab-per-modul
 * ==========================================================================
 * Membaca window.DCS_MODULES (diisi oleh config/modules/<modul>.config.js)
 * dan merender:
 *   1. Tab bar (1 tab per modul — pindah tab = centang semua tag modul itu
 *      otomatis di mode overlay, lepas centang tag modul lain)
 *   2. Panel deviasi otomatis PER TAG (selisih 2 series + band toleransi,
 *      dari config.deviationPairs) — tidak digabung antar tag supaya data
 *      2 instrumen berbeda (mis. Scrubber A vs B) tidak tercampur
 *   3. Kartu KPI ringkasan PER TAG (dari config.kpis)
 *   4. Tabel log record mentah PER TAG (dari config.logTableColumns)
 *
 * PENTING: file ini TIDAK BOLEH berisi apa pun yang spesifik-SO2. Semua
 * yang spesifik modul harus datang dari config/modules/<modul>.config.js.
 * Kalau nanti menambah FEGT/O2/dll, cukup buat config barunya — file ini
 * tidak perlu disentuh.
 * ==========================================================================
 */
(function () {
  'use strict';

  var els = {};
  var activeModuleKey = null;

  function cacheEls() {
    els.tabBar = document.getElementById('moduleTabBar');
    els.kpiBar = document.getElementById('moduleKpiBar');
    els.deviationArea = document.getElementById('moduleDeviationArea');
    els.logTable = document.getElementById('moduleLogTable');
  }

  function getModules() {
    var mods = window.DCS_MODULES || {};
    return Object.keys(mods).map(function (k) { return mods[k]; })
      .sort(function (a, b) { return (a.tabOrder || 0) - (b.tabOrder || 0); });
  }

  /* ------------------------------------------------------------------ */
  function renderTabBar() {
    if (!els.tabBar) return;
    var modules = getModules();
    els.tabBar.innerHTML = '';
    if (!modules.length) return;

    modules.forEach(function (mod) {
      var tab = document.createElement('button');
      tab.className = 'module-tab' + (mod.key === activeModuleKey ? ' module-tab-active' : '');
      tab.textContent = mod.tabLabel || mod.key;
      tab.dataset.moduleKey = mod.key;
      tab.addEventListener('click', function () { selectModule(mod.key); });
      els.tabBar.appendChild(tab);
    });
  }

  function selectModule(key) {
    activeModuleKey = key;
    renderTabBar();
    var mod = window.DCS_MODULES[key];
    if (!mod) return;

    // Batasi tag list panel kiri ke tag milik modul ini saja, lalu centang
    // SEMUA tag modul ini secara otomatis (mode overlay — supaya begitu pindah
    // tab, seluruh tag modul langsung tampil bersama di grafik combined).
    if (window.UIManager) {
      if (window.UIManager.filterTagsByIds) window.UIManager.filterTagsByIds(mod.tagIds);
      if (window.UIManager.setModuleActiveTags) window.UIManager.setModuleActiveTags(mod.tagIds);
    }
    renderModulePanels();
  }

  /* ------------------------------------------------------------------ */
  function getSeriesForTag(tagId) {
    var state = window.HistoricalManager.getState();
    return (state.lastLoadedSeries && state.lastLoadedSeries[tagId]) || {};
  }

  // Pasangkan titik seriesA & seriesB berdasarkan recordId yang sama
  // (1 record = 1 kejadian kalibrasi, jadi DCS & Local pada record yang
  // sama itulah yang layak dibandingkan, bukan dijodohkan berdasar waktu).
  function computeDeviationSeries(series, pairCfg) {
    var a = series[pairCfg.seriesA] || [];
    var b = series[pairCfg.seriesB] || [];
    var byRecordB = {};
    b.forEach(function (p) { byRecordB[p.recordId] = p; });

    var out = [];
    a.forEach(function (pa) {
      var pb = byRecordB[pa.recordId];
      if (!pb) return;
      out.push({
        time: pa.time,
        value: pa.value - pb.value,
        recordId: pa.recordId,
        pic: pa.pic
      });
    });
    out.sort(function (p1, p2) { return p1.time - p2.time; });
    return out;
  }

  /* ------------------------------------------------------------------ */
  function renderDeviationPanels(mod) {
    if (!els.deviationArea) return;
    els.deviationArea.innerHTML = '';
    if (!mod.deviationPairs || !mod.deviationPairs.length) return;

    (mod.tagIds || []).forEach(function (tagId) {
      var tag = window.TagManager.getTag(tagId);
      var series = getSeriesForTag(tagId);

      var tagHead = document.createElement('div');
      tagHead.className = 'module-tag-group-label';
      tagHead.textContent = tag ? (tag.id + ' — ' + tag.name) : tagId;
      els.deviationArea.appendChild(tagHead);

      mod.deviationPairs.forEach(function (pairCfg) {
        var devPoints = computeDeviationSeries(series, pairCfg);
        var wrap = document.createElement('div');
        wrap.className = 'deviation-panel';

        var last = devPoints.length ? devPoints[devPoints.length - 1] : null;
        var outOfTolerance = (pairCfg.toleranceValue != null && last) &&
          Math.abs(last.value) > pairCfg.toleranceValue;

        var domId = 'devChart_' + tagId.replace(/[^a-zA-Z0-9]/g, '_') + '_' + pairCfg.key;

        wrap.innerHTML =
          '<div class="deviation-panel-head">' +
            '<span class="deviation-panel-title">' + pairCfg.label + '</span>' +
            (last ? '<span class="deviation-panel-last' + (outOfTolerance ? ' deviation-out' : '') + '">' +
              (last.value >= 0 ? '+' : '') + last.value.toFixed(2) + ' ' + (pairCfg.unit || '') +
              '</span>' : '<span class="deviation-panel-last">-</span>') +
          '</div>' +
          '<div class="deviation-panel-desc">' + (pairCfg.description || '') + '</div>' +
          (devPoints.length
            ? '<div class="deviation-panel-chart" id="' + domId + '"></div>'
            : '<div class="deviation-panel-empty">Belum ada pasangan record ' + pairCfg.seriesA + '/' + pairCfg.seriesB + ' yang cocok pada rentang waktu ini.</div>');

        els.deviationArea.appendChild(wrap);

        if (devPoints.length && window.ChartManager.renderDeviationChart) {
          window.ChartManager.renderDeviationChart(domId, devPoints, pairCfg);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  function renderKpiCards(mod) {
    if (!els.kpiBar) return;
    els.kpiBar.innerHTML = '';
    if (!mod.kpis || !mod.kpis.length) return;

    (mod.tagIds || []).forEach(function (tagId) {
      var tag = window.TagManager.getTag(tagId);
      var series = getSeriesForTag(tagId);

      var group = document.createElement('div');
      group.className = 'kpi-group';

      var label = document.createElement('div');
      label.className = 'module-tag-group-label';
      label.textContent = tag ? (tag.id + ' — ' + tag.name) : tagId;
      group.appendChild(label);

      var row = document.createElement('div');
      row.className = 'kpi-group-row';
      mod.kpis.forEach(function (kpiCfg) {
        var value = computeKpiValue(kpiCfg, mod, series);
        var card = document.createElement('div');
        card.className = 'kpi-card';
        card.innerHTML =
          '<div class="kpi-card-label">' + kpiCfg.label + '</div>' +
          '<div class="kpi-card-value">' + value + '</div>';
        row.appendChild(card);
      });
      group.appendChild(row);
      els.kpiBar.appendChild(group);
    });
  }

  function computeKpiValue(kpiCfg, mod, series) {
    if (kpiCfg.source === 'lastValue') {
      var arr = series[kpiCfg.series] || [];
      if (!arr.length) return '-';
      return arr[arr.length - 1].value.toFixed(2);
    }
    if (kpiCfg.source === 'lastDeviation') {
      var pairCfg = (mod.deviationPairs || []).filter(function (p) { return p.key === kpiCfg.pair; })[0];
      if (!pairCfg) return '-';
      var dev = computeDeviationSeries(series, pairCfg);
      if (!dev.length) return '-';
      var last = dev[dev.length - 1];
      return (last.value >= 0 ? '+' : '') + last.value.toFixed(2) + ' ' + (pairCfg.unit || '');
    }
    if (kpiCfg.source === 'daysSinceLastRecord') {
      var allTimes = [];
      Object.keys(series).forEach(function (sk) {
        series[sk].forEach(function (p) { allTimes.push(p.time); });
      });
      if (!allTimes.length) return '-';
      var maxT = Math.max.apply(null, allTimes);
      var days = Math.floor((Date.now() - maxT) / 86400000);
      return days + ' hari';
    }
    return '-';
  }

  /* ------------------------------------------------------------------ */
  function renderLogTable(mod) {
    if (!els.logTable) return;
    els.logTable.innerHTML = '';
    if (!mod.logTableColumns || !mod.logTableColumns.length) return;

    (mod.tagIds || []).forEach(function (tagId) {
      var tag = window.TagManager.getTag(tagId);
      var series = getSeriesForTag(tagId);

      // Gabungkan semua series (milik 1 tag ini saja) jadi 1 baris per recordId.
      var byRecord = {};
      Object.keys(series).forEach(function (seriesKey) {
        series[seriesKey].forEach(function (p) {
          if (!byRecord[p.recordId]) byRecord[p.recordId] = { recordId: p.recordId, time: p.time, pic: p.pic };
          byRecord[p.recordId][seriesKey] = p.value;
        });
      });
      var rows = Object.keys(byRecord).map(function (k) { return byRecord[k]; })
        .sort(function (a, b) { return b.time - a.time; }); // terbaru dulu

      var label = document.createElement('div');
      label.className = 'module-tag-group-label';
      label.textContent = tag ? (tag.id + ' — ' + tag.name) : tagId;
      els.logTable.appendChild(label);

      if (!rows.length) {
        var empty = document.createElement('div');
        empty.className = 'module-log-empty';
        empty.textContent = 'Belum ada data pada rentang waktu ini.';
        els.logTable.appendChild(empty);
        return;
      }

      var thead = '<thead><tr>' + mod.logTableColumns.map(function (c) {
        return '<th>' + c.label + '</th>';
      }).join('') + '</tr></thead>';

      var tbody = '<tbody>' + rows.map(function (row) {
        return '<tr>' + mod.logTableColumns.map(function (c) {
          var v = row[c.key];
          if (c.key === 'time') v = v ? new Date(v).toLocaleString('id-ID') : '-';
          else if (typeof v === 'number') v = v.toFixed(2);
          else if (v === undefined || v === null) v = '-';
          return '<td>' + v + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';

      var tableWrap = document.createElement('div');
      tableWrap.innerHTML = '<table class="module-log-table">' + thead + tbody + '</table>';
      els.logTable.appendChild(tableWrap);
    });
  }

  /* ------------------------------------------------------------------ */
  function renderModulePanels() {
    if (!activeModuleKey) return;
    var mod = window.DCS_MODULES[activeModuleKey];
    if (!mod) return;
    renderKpiCards(mod);
    renderDeviationPanels(mod);
    renderLogTable(mod);
  }

  /* ------------------------------------------------------------------ */
  function init() {
    cacheEls();
    if (!els.tabBar) return; // index.html belum siapkan container tab — skip diam-diam
    renderTabBar();

    // Setiap kali data historical baru dimuat, render ulang panel supaya sinkron.
    window.addEventListener('dcsHistoricalLoadEnd', renderModulePanels);

    var modules = getModules();
    if (modules.length) selectModule(modules[0].key);
  }

  window.ModuleView = {
    init: init,
    selectModule: selectModule
  };
})();
