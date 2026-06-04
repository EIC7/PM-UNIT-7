/* ═══════════════════════════════════════════════════════════
   FEGT MODULE - SHARED FUNCTIONS & UTILITIES
   ═══════════════════════════════════════════════════════════ */

// ── SUPABASE FETCH (REST API)
function supaFetch(method, path, body) {
  var url = SUPA_URL + '/rest/v1/' + path;
  var opts = {
    method: method,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts)
    .then(r => r.json())
    .catch(err => {
      console.error('Supabase error:', err);
      throw err;
    });
}

// ── DATABASE SAVE
function dbSave(modul, tanggal, pic, wo, unit, data, recordId, callback) {
  var payload = {
    modul: modul,
    tanggal: tanggal,
    pic: pic,
    work_order: wo,
    unit: unit,
    data: data
  };
  
  var path = recordId 
    ? SUPA_TABLE + '?id=eq.' + recordId 
    : SUPA_TABLE;
  var method = recordId ? 'PATCH' : 'POST';
  
  supaFetch(method, path, payload)
    .then(function(result) {
      if (callback && result.length > 0) {
        callback(result[0].id);
      }
    })
    .catch(function(err) {
      alert('Database error: ' + (err.message || 'Unknown error'));
      console.error(err);
    });
}

// ── DATABASE LOAD
function dbLoad(id, callback) {
  supaFetch('GET', SUPA_TABLE + '?id=eq.' + id)
    .then(function(result) {
      if (callback) callback(result.length > 0 ? result[0] : null);
    })
    .catch(function(err) {
      alert('Load error: ' + err.message);
      if (callback) callback(null);
    });
}

// ── DATABASE DELETE
function dbDelete(id) {
  supaFetch('DELETE', SUPA_TABLE + '?id=eq.' + id)
    .then(function() {
      alert('Data dihapus');
    })
    .catch(function(err) {
      alert('Delete error: ' + err.message);
    });
}

// ── CLOCK UPDATE (real-time)
function updateClock() {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0');
  var mm = String(now.getMinutes()).padStart(2, '0');
  var ss = String(now.getSeconds()).padStart(2, '0');
  var el = document.getElementById('clock');
  if (el) el.textContent = hh + ':' + mm + ':' + ss;
}
setInterval(updateClock, 1000);
updateClock();

// ── STRING UTILITIES
function safe(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── HEADER MATCHING
function matchHeader(h, keys) {
  var lower = h.toString().toLowerCase().trim();
  return keys.some(function(k) { return lower.includes(k); });
}

// ── AUTO SET STATUS from temperature
function autoSetStatus(selectId, tempVal) {
  var sel = document.getElementById(selectId);
  if (!sel || sel.disabled) return;
  var val = parseFloat(tempVal);
  if (tempVal === '' || tempVal === null) return;
  sel.value = (!isNaN(val) && val > 0) ? 'ok' : 'data fail';
}

// ── NOTICE MESSAGES
function showNotice(msg, type) {
  var el = document.getElementById('noticeBox');
  el.className = 'notice ' + (type || 'info');
  el.innerHTML = msg;
  el.style.display = 'block';
}

function hideNotice() {
  var el = document.getElementById('noticeBox');
  if (el) el.style.display = 'none';
}

// ── MONTH HELPER
var BULAN2 = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

// ── SAFE CELL READ from Excel
function getCellSafe(ws, addr) {
  var cell = ws[addr];
  if (!cell) return '';
  if ((cell.t === 'd' || cell.t === 'n') && cell.w) {
    var pts = cell.w.split('/');
    if (pts.length === 3) {
      var month = parseInt(pts[0]) - 1, day = parseInt(pts[1]), year = parseInt(pts[2]);
      return String(day).padStart(2, '0') + ' ' + BULAN2[month] + ' ' + year;
    }
  }
  if (cell.t === 'n' && cell.v > 40000 && cell.v < 60000) {
    var d = new Date(Math.round((cell.v - 25569 + 0.5) * 86400 * 1000));
    return String(d.getUTCDate()).padStart(2, '0') + ' ' + BULAN2[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  return cell.v != null ? String(cell.v) : '';
}

// ── SHOW SUCCESS MESSAGE
function showSaveSuccess(id) {
  currentRecordId = id;
  var el = document.getElementById('dbStatusMsg');
  if (el) {
    el.textContent = 'Tersimpan ✓';
    el.style.color = '#27ae60';
    setTimeout(function() { el.textContent = ''; }, 3000);
  } else {
    alert('Tersimpan dengan ID: ' + id);
  }
}

// ── NORMALIZE MODULE NAME
function normalizeModul(m) {
  if (!m) return '';
  m = m.toString().toUpperCase();
  if (m.includes('FEGT')) return 'FEGT';
  if (m.includes('SO2')) return 'SO2';
  if (m.includes('OPACITY')) return 'OPACITY';
  if (m.includes('BELT')) {
    if (m.includes('E4') || m.includes('E5')) return 'BELT_E45';
    if (m.includes('E2') || m.includes('E3')) return 'BELT_E23';
    if (m.includes('B1') || m.includes('B2')) return 'BELT_B12';
  }
  return m;
}
