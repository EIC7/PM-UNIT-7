/* ═══════════════════════════════════════════════════════════
   FEGT MODULE - MAIN FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

// ── TAB SWITCHING
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabBtnUpload').classList.toggle('active', tab === 'upload');
  document.getElementById('tabBtnManual').classList.toggle('active', tab === 'manual');
  document.getElementById('tabUpload').classList.toggle('active', tab === 'upload');
  document.getElementById('tabManual').classList.toggle('active', tab === 'manual');
  if (tab === 'manual') {
    buildManualTable();
    document.getElementById('btnRun').disabled = false;
    document.getElementById('btnSave').disabled = false;
  } else {
    document.getElementById('btnRun').disabled = pathData.length === 0;
    document.getElementById('btnSave').disabled = true;
  }
  document.getElementById('previewPanel').style.display = 'none';
  document.getElementById('diagPanel').style.display = 'none';
  document.getElementById('btnPdf').disabled = true;
  pathData = []; 
  diagResults = {};
  for (var s = 1; s <= 8; s++) {
    var n = document.getElementById('snode-' + s);
    if (n) n.className = 'sensor-node unknown';
  }
  updateSvg();
}

// ── BUILD MANUAL TABLE (Path 1-21)
function buildManualTable() {
  var tbody = document.getElementById('manualTableBody');
  if (tbody.children.length > 0) return;
  PATHS.forEach(function(p) {
    var tr = document.createElement('tr');
    var pid = p.id;
    tr.innerHTML =
      '<td><span class="path-label">Path-' + pid + '</span></td>' +
      '<td><div class="sensor-pair"><span class="sensor-chip">' + p.tx + '</span>' +
        '<span style="color:var(--text3);font-size:12px">→</span>' +
        '<span class="sensor-chip">' + p.rx + '</span></div></td>' +
      '<td><input type="number" id="mtemp-' + pid + '" placeholder="0" min="0" max="9999"' +
        ' oninput="autoSetStatus(\'mstatus-' + pid + '\',this.value);onManualChange();"' +
        ' style="width:100px"></td>' +
      '<td><select id="mstatus-' + pid + '" onchange="onManualChange()">' +
        '<option value="ok" selected>OK / Valid</option>' +
        '<option value="data fail">Data Fail</option>' +
        '<option value="hard fail - low transmit">Hard Fail - Low Transmit</option>' +
      '</select></td>';
    tbody.appendChild(tr);
  });
}

// ── BUILD LEAK TABLE (Path 1-9)
function buildLeakTable() {
  var tbody = document.getElementById('leakTableBody');
  if (tbody.children.length > 0) return;
  LEAK_PATHS.forEach(function(p) {
    var pid = p.id;
    var isNA = !!p.defaultNA;
    var tr = document.createElement('tr');
    var inputAttrs = isNA
      ? 'disabled style="width:100px;background:#f0f0f0;color:#aaa"'
      : 'oninput="autoSetStatus(\'lkstatus-' + pid + '\',this.value);" style="width:100px"';
    var selectAttrs = isNA ? 'disabled style="background:#f0f0f0;color:#aaa"' : '';
    var options = isNA
      ? '<option value="na" selected>N/A</option>'
      : '<option value="ok" selected>OK / Valid</option>' +
        '<option value="data fail">Data Fail</option>' +
        '<option value="hard fail">Hard Fail</option>' +
        '<option value="na">N/A</option>';
    tr.innerHTML =
      '<td><span class="path-label">Path-' + pid + '</span></td>' +
      '<td style="font-size:13px;color:var(--text2)">' + p.desc + '</td>' +
      '<td><input type="number" id="lktemp-' + pid + '" placeholder="' + (isNA ? 'N/A' : '0') + '" min="0" max="9999" ' + inputAttrs + '></td>' +
      '<td><select id="lkstatus-' + pid + '" ' + selectAttrs + '>' + options + '</select></td>';
    tbody.appendChild(tr);
  });
}

function onManualChange() {
  collectManualData();
  updateSvg();
}

function collectManualData() {
  var rawDate = document.getElementById('manTanggal').value;
  var tanggalStr = '—';
  if (rawDate) {
    var parts = rawDate.split('-');
    tanggalStr = parts[2] + ' ' + BULAN2[parseInt(parts[1]) - 1] + ' ' + parts[0];
  }
  metaInfo = {
    tanggal: tanggalStr,
    shift: document.getElementById('manShift').value || '—',
    operator: document.getElementById('manOperator').value || '—'
  };
  pathData = PATHS.map(function(p) {
    var temp = parseFloat(document.getElementById('mtemp-' + p.id).value) || 0;
    var status = document.getElementById('mstatus-' + p.id).value || 'ok';
    return Object.assign({}, p, { temp: temp, statusRaw: status });
  });
}

// ── DRAG & DROP SETUP
function setupDragDrop() {
  var zone = document.getElementById('uploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', function(e) {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', function() {
    zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

// ── READ EXCEL FILE
function handleFile(file) {
  if (!file) return;
  hideNotice();
  document.getElementById('colMap').classList.remove('visible');
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var wb = XLSX.read(e.target.result, { type: 'array', cellDates: true, dateNF: 'DD/MM/YYYY' });
      var sheetName = wb.SheetNames.includes('FEGT Path Data') ? 'FEGT Path Data' : wb.SheetNames[0];
      var ws = wb.Sheets[sheetName]; 
      wsData = ws;
      var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (aoa.length < 2) {
        showNotice('File Excel kosong atau tidak bisa dibaca.', 'err');
        return;
      }
      var headerRowIdx = -1;
      for (var i = 0; i < Math.min(aoa.length, 10); i++) {
        var row = aoa[i];
        var hits = row.filter(function(c) {
          var s = c.toString().toLowerCase();
          return (matchHeader(c, PATH_KEYS) || matchHeader(c, TEMP_KEYS) || matchHeader(c, STATUS_KEYS));
        });
        if (hits.length >= 2) {
          headerRowIdx = i;
          break;
        }
      }
      if (headerRowIdx < 0) {
        showNotice('Kolom Path, Temp/Status tidak ditemukan di 10 baris pertama.', 'warn');
        document.getElementById('colMap').classList.add('visible');
        rawHeaders = aoa[0] || [];
        rawRows = aoa.slice(1);
        rebuildColMaps();
        return;
      }
      rawHeaders = aoa[headerRowIdx];
      rawRows = aoa.slice(headerRowIdx + 1);
      var idxPath = rawHeaders.findIndex(function(h) { return matchHeader(h, PATH_KEYS); });
      var idxTemp = rawHeaders.findIndex(function(h) { return matchHeader(h, TEMP_KEYS); });
      var idxStatus = rawHeaders.findIndex(function(h) { return matchHeader(h, STATUS_KEYS); });
      if (idxPath < 0 || idxTemp < 0 || idxStatus < 0) {
        showNotice('Kolom tidak valid untuk Path/Temp/Status.', 'warn');
        document.getElementById('colMap').classList.add('visible');
        rebuildColMaps();
        return;
      }
      buildPathData(idxTemp, idxStatus);
      document.getElementById('fileInfo').classList.add('visible');
      document.getElementById('fileName').textContent = file.name;
      document.getElementById('fileMeta').textContent = rawRows.length + ' baris data';
      document.getElementById('btnRun').disabled = false;
      document.getElementById('btnSave').disabled = false;
      showNotice('File berhasil dimuat ✓', 'ok');
    } catch (err) {
      showNotice('Error membaca file: ' + err.message, 'err');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── BUILD PATH DATA from Excel
function buildPathData(idxTemp, idxStatus) {
  pathData = [];
  rawRows.forEach(function(row) {
    var temp = parseFloat(row[idxTemp]) || 0;
    var status = (row[idxStatus] || 'ok').toString().toLowerCase();
    status = status.includes('fail') ? (status.includes('hard') ? 'hard fail - low transmit' : 'data fail') : 'ok';
    var pathId = Math.min(Math.max(pathData.length + 1, 1), 21);
    pathData.push({
      id: pathId,
      tx: PATHS[pathId - 1].tx,
      rx: PATHS[pathId - 1].rx,
      temp: temp,
      statusRaw: status
    });
  });
  collectManualData();
  buildPreview();
  updateSvg();
}

// ── BUILD PREVIEW TABLE
function buildPreview() {
  document.getElementById('previewPanel').style.display = 'block';
  document.getElementById('metaBar').classList.add('visible');
  document.getElementById('mTanggal').textContent = metaInfo.tanggal;
  document.getElementById('mShift').textContent = metaInfo.shift;
  document.getElementById('mOperator').textContent = metaInfo.operator;
  var tbody = document.getElementById('previewTableBody');
  tbody.innerHTML = '';
  pathData.forEach(function(p) {
    var tr = document.createElement('tr');
    var statusLabel = p.statusRaw === 'ok' ? 'OK / Valid' : p.statusRaw === 'data fail' ? 'Data Fail' : 'Hard Fail';
    tr.innerHTML =
      '<td><span class="path-label">Path-' + p.id + '</span></td>' +
      '<td><span class="sensor-chip">' + p.tx + '</span> → <span class="sensor-chip">' + p.rx + '</span></td>' +
      '<td class="num">' + (p.temp > 0 ? p.temp.toFixed(1) : '—') + ' °C</td>' +
      '<td><span class="stat-' + (p.statusRaw === 'ok' ? 'ok' : 'fail') + '">' + statusLabel + '</span></td>';
    tbody.appendChild(tr);
  });
}

// ── RUN DIAGNOSIS
function runDiagnosis() {
  document.getElementById('diagPanel').style.display = 'block';
  document.getElementById('previewPanel').style.display = 'none';
  diagResults = {};
  var diagsPerSensor = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: []
  };
  pathData.forEach(function(p) {
    var txId = p.tx, rxId = p.rx;
    var status = p.statusRaw === 'ok' ? 'ok' : p.statusRaw.includes('hard') ? 'hard' : 'fail';
    diagsPerSensor[txId].push({ rx: rxId, status: status });
    diagsPerSensor[rxId].push({ tx: txId, status: status });
  });
  for (var sid = 1; sid <= 8; sid++) {
    var diags = diagsPerSensor[sid];
    var okCount = diags.filter(function(d) { return d.status === 'ok'; }).length;
    var failCount = diags.filter(function(d) { return d.status === 'fail'; }).length;
    var hardCount = diags.filter(function(d) { return d.status === 'hard'; }).length;
    var verdict = 'ok';
    if (hardCount > 0) verdict = 'hard';
    else if (failCount >= Math.ceil(diags.length / 2)) verdict = 'fail';
    else if (failCount > 0) verdict = 'warning';
    diagResults[sid] = {
      ok: okCount, fail: failCount, hard: hardCount, total: diags.length, verdict: verdict
    };
    var node = document.getElementById('snode-' + sid);
    if (node) {
      node.className = 'sensor-node ' + verdict;
      var tip = document.getElementById('stip-' + sid);
      if (tip) {
        var verdictText = verdict === 'ok' ? 'OK' : verdict === 'hard' ? 'HARD FAIL' : verdict === 'warning' ? 'WARNING' : 'DATA FAIL';
        tip.textContent = 'Sensor ' + sid + ' — ' + verdictText + ' (' + okCount + ' OK, ' + failCount + ' Fail, ' + hardCount + ' Hard)';
      }
    }
  }
  updateSvg();
  var diagGrid = document.getElementById('diagGrid');
  diagGrid.innerHTML = '';
  for (var s = 1; s <= 8; s++) {
    var dr = diagResults[s];
    var div = document.createElement('div');
    div.className = 'diag-card ' + dr.verdict;
    var verdictLabel = dr.verdict === 'ok' ? 'OK' : dr.verdict === 'hard' ? 'HARD FAIL' : dr.verdict === 'warning' ? 'WARNING' : 'DATA FAIL';
    div.innerHTML =
      '<div class="diag-header">Sensor ' + s + '</div>' +
      '<div class="diag-stat ok">OK: ' + dr.ok + '</div>' +
      '<div class="diag-stat fail">Fail: ' + dr.fail + '</div>' +
      '<div class="diag-stat hard">Hard: ' + dr.hard + '</div>' +
      '<div class="diag-verdict">' + verdictLabel + '</div>';
    diagGrid.appendChild(div);
  }
  document.getElementById('btnPdf').disabled = false;
}

// ── UPDATE SVG (path visualization)
function updateSvg() {
  var svg = document.getElementById('pathSvg');
  if (!svg) return;
  svg.innerHTML = '';
  pathData.forEach(function(p) {
    var txPos = SENSOR_POS[String(p.tx)];
    var rxPos = SENSOR_POS[String(p.rx)];
    if (!txPos || !rxPos) return;
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', txPos.x);
    line.setAttribute('y1', txPos.y);
    line.setAttribute('x2', rxPos.x);
    line.setAttribute('y2', rxPos.y);
    var strokeColor = p.statusRaw === 'ok' ? '#27ae60' : p.statusRaw.includes('hard') ? '#8e44ad' : '#c0392b';
    var strokeWidth = p.statusRaw === 'ok' ? '2' : '3';
    line.setAttribute('stroke', strokeColor);
    line.setAttribute('stroke-width', strokeWidth);
    line.setAttribute('opacity', '0.7');
    svg.appendChild(line);
  });
}

// ── RESET ALL
function resetAll() {
  pathData = [];
  diagResults = {};
  metaInfo = { tanggal: '—', shift: '—', operator: '—' };
  rawHeaders = [];
  rawRows = [];
  document.getElementById('fileInput').value = '';
  document.getElementById('fileInfo').classList.remove('visible');
  document.getElementById('colMap').classList.remove('visible');
  document.getElementById('metaBar').classList.remove('visible');
  document.getElementById('fileName').textContent = '—';
  document.getElementById('fileMeta').textContent = '—';
  hideNotice();
  document.getElementById('manTanggal').value = '';
  document.getElementById('manShift').value = '';
  document.getElementById('manOperator').value = '';
  PATHS.forEach(function(p) {
    var t = document.getElementById('mtemp-' + p.id);
    var s = document.getElementById('mstatus-' + p.id);
    if (t) t.value = '';
    if (s) s.value = 'ok';
  });
  document.getElementById('btnRun').disabled = activeTab === 'manual' ? false : true;
  document.getElementById('btnPdf').disabled = true;
  document.getElementById('previewPanel').style.display = 'none';
  document.getElementById('diagPanel').style.display = 'none';
  document.getElementById('diagGrid').innerHTML = '';
  for (var s = 1; s <= 8; s++) {
    var n = document.getElementById('snode-' + s);
    if (n) n.className = 'sensor-node unknown';
  }
  updateSvg();
}

// ── LEAK DETECTION
function runLeakDiagnosis() {
  var results = LEAK_PATHS.map(function(p) {
    var temp = parseFloat(document.getElementById('lktemp-' + p.id).value) || 0;
    var status = document.getElementById('lkstatus-' + p.id).value || (p.defaultNA ? 'na' : 'ok');
    return Object.assign({}, p, { temp: temp, status: status });
  });
  var okC = 0, failC = 0, naC = 0, hardC = 0;
  results.forEach(function(r) {
    if (r.status === 'na') naC++;
    else if (r.status === 'ok') okC++;
    else if (r.status.includes('hard')) hardC++;
    else failC++;
  });
  var issues = results.filter(function(r) {
    return r.status.includes('fail') || r.status.includes('hard');
  });
  var div = document.getElementById('leakResult');
  div.style.display = 'block';
  var html = '<div class="stat-row" style="margin-bottom:16px">' +
    '<div class="stat-chip total">Total <span>' + results.length + '</span></div>' +
    '<div class="stat-chip ok">OK <span>' + okC + '</span></div>' +
    '<div class="stat-chip fail">Fail <span>' + (failC + hardC) + '</span></div>' +
    '<div class="stat-chip" style="background:#f5f5f5;border-color:#ccc;color:#888">N/A <span>' + naC + '</span></div>' +
  '</div>';
  if (issues.length === 0) {
    html += '<div class="conclusion-box all-ok"><div class="conc-title">✓ Leak Detection - No Issues</div>' +
      '<div style="font-size:13px;color:var(--text2)">Semua path aktif terbaca normal. Tidak ada indikasi kebocoran.</div></div>';
  } else {
    html += '<div class="conclusion-box has-issue"><div class="conc-title">✕ Leak Detected / Needs Inspection</div>' +
      '<div style="font-size:13px;color:var(--text2)">Path bermasalah: <strong>' + issues.map(function(r) {
        return 'Path-' + r.id;
      }).join(', ') + '</strong><br>' +
      '<span style="font-size:12px;color:var(--text3)">Lakukan inspeksi fisik pada path yang menunjukkan Data Fail atau Hard Fail.</span></div></div>';
  }
  div.innerHTML = html;
}

function resetLeak() {
  LEAK_PATHS.forEach(function(p) {
    var t = document.getElementById('lktemp-' + p.id);
    var s = document.getElementById('lkstatus-' + p.id);
    if (t && !t.disabled) t.value = '';
    if (s && !s.disabled) s.value = 'ok';
  });
  var div = document.getElementById('leakResult');
  if (div) div.style.display = 'none';
}

// ── FEGT SAVE
function fegtSave() {
  collectManualData();
  var data = {
    tanggal: metaInfo.tanggal,
    shift: metaInfo.shift,
    operator: metaInfo.operator,
    paths: pathData.map(function(p) {
      return { id: p.id, temp: p.temp, status: p.statusRaw };
    })
  };
  dbSave('FEGT', metaInfo.tanggal, metaInfo.operator, '', 'Unit 7', data, currentRecordId, showSaveSuccess);
}

// ── REBUILD COLUMN MAPS from Excel headers
function rebuildColMaps() {
  var headers = rawHeaders || [];
  var mapTemp = document.getElementById('mapTemp');
  var mapStatus = document.getElementById('mapStatus');
  var mapTanggal = document.getElementById('mapTanggal');
  var mapShift = document.getElementById('mapShift');
  
  [mapTemp, mapStatus, mapTanggal, mapShift].forEach(function(el) {
    if (el) {
      el.innerHTML = '<option value="">— pilih kolom —</option>';
      headers.forEach(function(h, i) {
        var opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = safe(h);
        el.appendChild(opt);
      });
    }
  });
}

// ── APPLY MANUAL COLUMN MAPPING
function applyMapping() {
  var idxTemp = parseInt(document.getElementById('mapTemp').value);
  var idxStatus = parseInt(document.getElementById('mapStatus').value);
  
  if (isNaN(idxTemp) || isNaN(idxStatus)) {
    showNotice('Pilih kolom Temp dan Status terlebih dahulu', 'err');
    return;
  }
  
  buildPathData(idxTemp, idxStatus);
  document.getElementById('colMap').classList.remove('visible');
  document.getElementById('fileInfo').classList.add('visible');
  document.getElementById('fileName').textContent = '(Manual Mapping Applied)';
  document.getElementById('fileMeta').textContent = rawRows.length + ' baris data';
  document.getElementById('btnRun').disabled = false;
  document.getElementById('btnSave').disabled = false;
  showNotice('Mapping berhasil diterapkan ✓', 'ok');
}

// ── INIT ON LOAD
window.addEventListener('DOMContentLoaded', function() {
  setupDragDrop();
  buildManualTable();
  buildLeakTable();
});
