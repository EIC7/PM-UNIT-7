/**
 * ==========================================================================
 * UI MANAGER
 * ==========================================================================
 * Menghubungkan DOM (index.html) dengan modul-modul lain. Tidak ada logic
 * data di sini — murni render + event wiring.
 * ==========================================================================
 */
(function () {
  'use strict';

  var els = {}; // cache DOM elements
  var selectedTagId = null;

  function cacheEls() {
    els.clock = document.getElementById('clockValue');
    els.tagListBody = document.getElementById('tagListBody');
    els.tagSearch = document.getElementById('tagSearch');
    els.tagDetails = document.getElementById('tagDetailsBody');
    els.chartContainer = document.getElementById('trendChart');
    els.quickRangeBar = document.getElementById('quickRangeBar');
    els.startDate = document.getElementById('startDate');
    els.startTime = document.getElementById('startTime');
    els.endDate = document.getElementById('endDate');
    els.endTime = document.getElementById('endTime');
    els.loadDataBtn = document.getElementById('loadDataBtn');
    els.modeLiveBtn = document.getElementById('modeLiveBtn');
    els.modeHistBtn = document.getElementById('modeHistBtn');
    els.liveNotice = document.getElementById('liveModeNotice');
    els.historicalPanel = document.getElementById('historicalPanel');
    els.statusBar = document.getElementById('statusBar');
    els.chartTitle = document.getElementById('chartTitle');
    els.autoScaleBtn = document.getElementById('autoScaleBtn');
    els.exportCsvBtn = document.getElementById('exportCsvBtn');
    els.exportJsonBtn = document.getElementById('exportJsonBtn');
    els.exportImgBtn = document.getElementById('exportImgBtn');
    els.loadingIndicator = document.getElementById('loadingIndicator');
  }

  /* ------------------------------------------------------------------ */
  function tickClock() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    if (els.clock) {
      els.clock.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
  }

  /* ------------------------------------------------------------------ */
  function renderTagList(filterText) {
    if (!els.tagListBody) return;
    var tags = window.TagManager.getAllTags();
    if (filterText) {
      var f = filterText.toLowerCase();
      tags = tags.filter(function (t) {
        return t.id.toLowerCase().indexOf(f) >= 0 || t.name.toLowerCase().indexOf(f) >= 0;
      });
    }
    els.tagListBody.innerHTML = '';
    if (!tags.length) {
      els.tagListBody.innerHTML = '<div class="tag-empty">Tidak ada tag.</div>';
      return;
    }
    tags.forEach(function (tag) {
      var row = document.createElement('div');
      row.className = 'tag-row' + (tag.id === selectedTagId ? ' tag-row-active' : '');
      row.dataset.tagId = tag.id;
      row.innerHTML =
        '<div class="tag-row-top">' +
          '<input type="checkbox" class="tag-visible-cb" ' + (tag.visible ? 'checked' : '') + '>' +
          '<span class="tag-id">' + tag.id + '</span>' +
        '</div>' +
        '<div class="tag-name">' + tag.name + '</div>' +
        '<div class="tag-meta"><span class="tag-source">' + (tag.source || '') + '</span></div>';

      row.querySelector('.tag-visible-cb').addEventListener('change', function (e) {
        e.stopPropagation();
        window.DCSTrend.setTagVisibility(tag.id, e.target.checked);
      });
      row.addEventListener('click', function () { selectTag(tag.id); });
      els.tagListBody.appendChild(row);
    });
  }

  function selectTag(tagId) {
    selectedTagId = tagId;
    renderTagList(els.tagSearch ? els.tagSearch.value : '');
    renderTagDetails(tagId);
    var tag = window.TagManager.getTag(tagId);
    if (els.chartTitle) els.chartTitle.textContent = tag ? (tag.id + ' — ' + tag.name) : 'TREND GRAPH';
    // Render ulang chart pakai data yang sudah pernah di-load (kalau ada)
    var series = window.DCSTrend.getHistoricalData(tagId);
    if (tag) window.ChartManager.renderHistoricalTag(tag, series || {});
  }

  function renderTagDetails(tagId) {
    if (!els.tagDetails) return;
    var tag = window.TagManager.getTag(tagId);
    if (!tag) { els.tagDetails.innerHTML = '<div class="details-empty">Pilih tag di panel kiri.</div>'; return; }
    els.tagDetails.innerHTML =
      '<div class="detail-row"><span class="detail-label">TAG ID</span><span class="detail-value">' + tag.id + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">NAME</span><span class="detail-value">' + tag.name + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">UNIT</span><span class="detail-value">' + (tag.unit || '-') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">ENG. LOW</span><span class="detail-value">' + tag.engineeringLow + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">ENG. HIGH</span><span class="detail-value">' + tag.engineeringHigh + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">SOURCE</span><span class="detail-value">' + tag.source + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">MODUL</span><span class="detail-value">' + (tag.sourceModul || '-') + '</span></div>' +
      '<div class="detail-desc">' + (tag.description || '') + '</div>';
  }

  /* ------------------------------------------------------------------ */
  function renderQuickRangeBar() {
    if (!els.quickRangeBar) return;
    els.quickRangeBar.innerHTML = '';
    window.DCS_CONFIG.QUICK_RANGES.forEach(function (r) {
      var btn = document.createElement('button');
      btn.className = 'range-btn' + (r.key === window.DCS_CONFIG.DEFAULT_QUICK_RANGE ? ' range-btn-active' : '');
      btn.textContent = r.label;
      btn.dataset.rangeKey = r.key;
      btn.addEventListener('click', function () { onQuickRangeClick(r.key, btn); });
      els.quickRangeBar.appendChild(btn);
    });
  }

  function onQuickRangeClick(key, btnEl) {
    Array.prototype.forEach.call(els.quickRangeBar.children, function (b) { b.classList.remove('range-btn-active'); });
    btnEl.classList.add('range-btn-active');
    if (key === 'CUSTOM') {
      if (els.historicalPanel) els.historicalPanel.classList.add('custom-range-open');
      return;
    }
    if (els.historicalPanel) els.historicalPanel.classList.remove('custom-range-open');
    window.HistoricalManager.setQuickRange(key);
    triggerLoad();
  }

  function onLoadDataClick() {
    var activeBtn = els.quickRangeBar ? els.quickRangeBar.querySelector('.range-btn-active') : null;
    if (activeBtn && activeBtn.dataset.rangeKey === 'CUSTOM') {
      var start = new Date((els.startDate.value || '') + 'T' + (els.startTime.value || '00:00')).getTime();
      var end = new Date((els.endDate.value || '') + 'T' + (els.endTime.value || '23:59')).getTime();
      var res = window.HistoricalManager.setCustomRange(start, end);
      if (!res.ok) { alert('Rentang waktu tidak valid. Periksa tanggal/jam Start dan End.'); return; }
    }
    triggerLoad();
  }

  function triggerLoad() {
    setLoading(true);
    window.HistoricalManager.loadData(function (series) {
      setLoading(false);
      updateStatusBar();
      if (selectedTagId) {
        var tag = window.TagManager.getTag(selectedTagId);
        window.ChartManager.renderHistoricalTag(tag, series[selectedTagId] || {});
      }
    }, function (err) {
      setLoading(false);
      alert('Gagal memuat data historical: ' + err.message);
    });
  }

  function setLoading(isLoading) {
    if (els.loadDataBtn) { els.loadDataBtn.disabled = isLoading; els.loadDataBtn.textContent = isLoading ? 'MEMUAT...' : 'LOAD DATA'; }
    if (els.loadingIndicator) els.loadingIndicator.style.display = isLoading ? 'inline' : 'none';
  }

  /* ------------------------------------------------------------------ */
  function updateStatusBar() {
    if (!els.statusBar) return;
    var tags = window.TagManager.getAllTags();
    var activeTrends = tags.filter(function (t) { return t.visible; }).length;
    var state = window.HistoricalManager.getState();
    var totalRecords = Object.keys(state.lastLoadedSeries).reduce(function (sum, tagId) {
      var s = state.lastLoadedSeries[tagId];
      return sum + Object.keys(s).reduce(function (s2, k) { return s2 + s[k].length; }, 0);
    }, 0);
    els.statusBar.innerHTML =
      '<span>SYSTEM: RUNNING</span>' +
      '<span>MODE: HISTORICAL</span>' +
      '<span>DATA SOURCE: SUPABASE (pm_records, read-only)</span>' +
      '<span class="status-conn">CONNECTION: <span class="dot dot-ok"></span> READY</span>' +
      '<span>TOTAL TAGS: ' + tags.length + '</span>' +
      '<span>ACTIVE TRENDS: ' + activeTrends + '</span>' +
      '<span>RECORDS: ' + totalRecords.toLocaleString('id-ID') + '</span>';
  }

  /* ------------------------------------------------------------------ */
  function onModeClick(mode) {
    if (mode === 'live') {
      els.modeLiveBtn.classList.add('mode-btn-active');
      els.modeHistBtn.classList.remove('mode-btn-active');
      if (els.liveNotice) els.liveNotice.style.display = 'block';
      if (els.historicalPanel) els.historicalPanel.style.display = 'none';
    } else {
      els.modeHistBtn.classList.add('mode-btn-active');
      els.modeLiveBtn.classList.remove('mode-btn-active');
      if (els.liveNotice) els.liveNotice.style.display = 'none';
      if (els.historicalPanel) els.historicalPanel.style.display = 'flex';
    }
  }

  function bindEvents() {
    if (els.tagSearch) els.tagSearch.addEventListener('input', function (e) { renderTagList(e.target.value); });
    if (els.loadDataBtn) els.loadDataBtn.addEventListener('click', onLoadDataClick);
    if (els.modeLiveBtn) els.modeLiveBtn.addEventListener('click', function () { onModeClick('live'); });
    if (els.modeHistBtn) els.modeHistBtn.addEventListener('click', function () { onModeClick('historical'); });
    if (els.autoScaleBtn) els.autoScaleBtn.addEventListener('click', function () { window.ChartManager.autoScale(); });
    if (els.exportCsvBtn) els.exportCsvBtn.addEventListener('click', function () { if (selectedTagId) window.DCSTrend.exportData(selectedTagId, 'csv'); });
    if (els.exportJsonBtn) els.exportJsonBtn.addEventListener('click', function () { if (selectedTagId) window.DCSTrend.exportData(selectedTagId, 'json'); });
    if (els.exportImgBtn) els.exportImgBtn.addEventListener('click', function () { if (selectedTagId) window.ChartManager.exportImage(selectedTagId); });

    window.addEventListener('dcsTagListChanged', function () { renderTagList(els.tagSearch ? els.tagSearch.value : ''); });
  }

  function init() {
    cacheEls();
    bindEvents();
    tickClock();
    setInterval(tickClock, 1000);
    renderQuickRangeBar();
    renderTagList();
    updateStatusBar();
    onModeClick('historical'); // default mode sesuai arahan
    // Pilih tag pertama secara default agar chart langsung terisi
    var firstTag = window.TagManager.getAllTags()[0];
    if (firstTag) selectTag(firstTag.id);
  }

  window.UIManager = {
    init: init,
    renderTagList: renderTagList,
    updateStatusBar: updateStatusBar,
    triggerLoad: triggerLoad
  };
})();
