// ============================================================
// SHARED UTILITY FUNCTIONS
// ============================================================

// Polyfill: Object.entries
if (!Object.entries) {
  Object.entries = function(obj) {
    var entries = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) entries.push([key, obj[key]]);
    }
    return entries;
  };
}

// Polyfill: Object.assign
if (!Object.assign) {
  Object.assign = function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) target[key] = source[key];
      }
    }
    return target;
  };
}

// ============================================================
// MODULE NORMALIZATION
// ============================================================

function normalizeModul(name) {
  if (!name) return '';
  var n = String(name).toUpperCase().trim();
  if (n.indexOf('FEGT') >= 0 || n.indexOf('LEAK') >= 0) return 'FEGT';
  if (n.indexOf('SO2') >= 0 || n.indexOf('SCRUBBER') >= 0) return 'SO2';
  if (n.indexOf('OPACITY') >= 0) return 'OPACITY';
  if (n.indexOf('BELT') >= 0) {
    if (n.indexOf('E4') >= 0 || n.indexOf('E5') >= 0) return 'BELT_E45';
    if (n.indexOf('E2') >= 0 || n.indexOf('E3') >= 0) return 'BELT_E23';
    if (n.indexOf('B1') >= 0 || n.indexOf('B2') >= 0) return 'BELT_B12';
  }
  return '';
}

// ============================================================
// DOM HELPERS
// ============================================================

function setVal(id, val) {
  var e = document.getElementById(id);
  if (e) e.value = val || '';
}

function getVal(id) {
  var e = document.getElementById(id);
  return e ? e.value : '';
}

function setChk(id, checked) {
  var e = document.getElementById(id);
  if (e) e.checked = !!checked;
}

function gv(id) { return getVal(id); }
function gv2(id) { return getVal(id); }
function gv3(id) { return getVal(id); }
function gv4(id) { return getVal(id); }

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function toast(msgId) {
  var el = document.getElementById(msgId);
  if (el) {
    el.textContent = 'Tersimpan ✓';
    el.style.color = '#27ae60';
    setTimeout(function() { el.textContent = ''; }, 3000);
  }
}

function dbShowToast(msg, type) {
  // Global toast notification (optional)
}

// ============================================================
// SUPABASE REST API
// ============================================================

function supaFetch(method, path, body) {
  var headers = {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY
  };
  var opts = { method: method, headers: headers };
  if (body) opts.body = JSON.stringify(body);
  return fetch(SUPA_URL + '/rest/v1' + path, opts);
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

var currentRecordId = null;

function dbSave(modul, tanggal, pic, wo, unit, data, id, callback) {
  var rec = { modul: modul, tanggal: tanggal, pic: pic, work_order: wo, unit: unit, data: data };
  if (id) {
    // UPDATE
    supaFetch('PATCH', '/' + SUPA_TABLE + '?id=eq.' + id, rec)
      .then(r => r.json())
      .then(() => { if (callback) callback(id); })
      .catch(e => console.error('dbSave error:', e));
  } else {
    // INSERT
    supaFetch('POST', '/' + SUPA_TABLE, rec)
      .then(r => r.json())
      .then(rows => { if (callback && rows[0]) callback(rows[0].id); })
      .catch(e => console.error('dbSave error:', e));
  }
}

function dbLoad(id, callback) {
  supaFetch('GET', '/' + SUPA_TABLE + '?id=eq.' + id)
    .then(r => r.json())
    .then(rows => { if (callback && rows[0]) callback(rows[0]); })
    .catch(e => console.error('dbLoad error:', e));
}

function dbList(modul, callback) {
  // Fetch all and filter in JS (for flexibility)
  supaFetch('GET', '/' + SUPA_TABLE + '?order=created_at.desc&limit=500')
    .then(r => r.json())
    .then(rows => {
      if (modul) {
        rows = rows.filter(r => normalizeModul(r.modul) === normalizeModul(modul));
      }
      if (callback) callback(rows);
    })
    .catch(e => console.error('dbList error:', e));
}

function dbDelete(id) {
  supaFetch('DELETE', '/' + SUPA_TABLE + '?id=eq.' + id)
    .then(() => { console.log('Deleted:', id); window.location.reload(); })
    .catch(e => console.error('dbDelete error:', e));
}

function dbLoadRiwayat() {
  dbList('', function(rows) {
    // Global dashboard load
    console.log('Loaded riwayat:', rows.length, 'records');
  });
}

// ============================================================
// FILE UTILITIES
// ============================================================

var IMG_EXTS = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|heic|heif|avif)$/i;

function isImageFile(file) {
  if (!file) return false;
  if (IMG_EXTS.test(file.name)) return true;
  if (file.type && file.type.startsWith('image/')) return true;
  return false;
}

function fileIcon(name) {
  if (/\.(pdf)$/i.test(name)) return '📄';
  if (/\.(doc|docx)$/i.test(name)) return '📝';
  if (/\.(xls|xlsx)$/i.test(name)) return '📊';
  if (IMG_EXTS.test(name)) return '🖼️';
  return '📎';
}

// ============================================================
// IMAGE HANDLING
// ============================================================

function fileToJpegDataUrl(file, callback) {
  if (!file) { callback(null); return; }
  
  // Check if HEIC (needs special handling)
  if (file.type === 'image/heic' || file.type === 'image/heif' || /\.heic$/i.test(file.name)) {
    // Try HEIC2Any if available
    if (typeof heic2any !== 'undefined') {
      heic2any({ blob: file, toType: 'image/jpeg' })
        .then(blob => {
          var r = new FileReader();
          r.onload = () => callback(r.result);
          r.readAsDataURL(blob);
        })
        .catch(() => fallbackJpegConvert(file, callback));
    } else {
      fallbackJpegConvert(file, callback);
    }
  } else {
    fallbackJpegConvert(file, callback);
  }
}

function fallbackJpegConvert(file, callback) {
  var r = new FileReader();
  r.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      var c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      callback(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => callback(ev.target.result);
    img.src = ev.target.result;
  };
  r.readAsDataURL(file);
}

// ============================================================
// EXPORT (for modular structure)
// ============================================================
// All functions are global, no export needed in browser environment
