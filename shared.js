/* ═══════════════════════════════════════════════════════
   SHARED.JS — Common utilities untuk semua modul PM Unit 7
   ═══════════════════════════════════════════════════════ */

/* ── POLYFILLS (old Android Chrome) ── */
if (!Object.entries) {
  Object.entries = function(obj) {
    var keys = Object.keys(obj), arr = [];
    for (var i = 0; i < keys.length; i++) arr.push([keys[i], obj[keys[i]]]);
    return arr;
  };
}
if (!Object.assign) {
  Object.assign = function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src) for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  };
}
if (!Array.from) { Array.from = function(arr) { return Array.prototype.slice.call(arr); }; }
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(fn) {
    for (var i = 0; i < this.length; i++) if (fn(this[i], i)) return i;
    return -1;
  };
}
if (!Array.prototype.find) {
  Array.prototype.find = function(fn) {
    for (var i = 0; i < this.length; i++) if (fn(this[i], i)) return this[i];
    return undefined;
  };
}
if (!Array.prototype.includes) { Array.prototype.includes = function(v) { return this.indexOf(v) !== -1; }; }
if (!String.prototype.includes) { String.prototype.includes = function(s) { return this.indexOf(s) !== -1; }; }
if (!String.prototype.startsWith) { String.prototype.startsWith = function(s) { return this.indexOf(s) === 0; }; }
if (!String.prototype.endsWith) { String.prototype.endsWith = function(s) { return this.slice(-s.length) === s; }; }
if (!String.prototype.padStart) {
  String.prototype.padStart = function(len, ch) {
    var s = String(this); ch = ch || ' ';
    while (s.length < len) s = ch + s;
    return s;
  };
}
if (!String.prototype.padEnd) {
  String.prototype.padEnd = function(len, ch) {
    var s = String(this); ch = ch || ' ';
    while (s.length < len) s = s + ch;
    return s;
  };
}
if (!Number.isNaN) { Number.isNaN = function(v) { return typeof v === 'number' && isNaN(v); }; }
if (!Number.isInteger) { Number.isInteger = function(v) { return typeof v === 'number' && Math.floor(v) === v; }; }

/* ── SUPABASE CONFIG ── */
var SUPA_URL   = 'https://ruvvximnnacpvvoogbzs.supabase.co';
var SUPA_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE1NDAsImV4cCI6MjA5NDYxNzU0MH0.GRu5n0Jl2fP0V8L_QLN2Tkmd0Aw0JbMRu25I7t-R7l8';
var SUPA_TABLE = 'pm_records';

function supaFetch(method, path, body) {
  var opts = {
    method: method,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(SUPA_URL + '/rest/v1/' + path, opts)
    .then(function(res) {
      if (!res.ok) return res.text().then(function(t){ throw new Error(t); });
      return res.text().then(function(t){ return t ? JSON.parse(t) : []; });
    });
}

/* ── TOAST NOTIFICATION ── */
function dbShowToast(msg) {
  var t = document.getElementById('dbToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'dbToast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#16a085;color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.3s;white-space:nowrap;max-width:90vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(function(){ t.style.opacity='0'; }, 3000);
}

/* ── DB LOAD (satu record by ID) ── */
function dbLoad(id, callback) {
  supaFetch('GET', SUPA_TABLE + '?id=eq.' + id + '&limit=1')
    .then(function(rows) {
      if (rows && rows[0]) callback(rows[0]);
      else alert('Data tidak ditemukan.');
    })
    .catch(function(err){ alert('Gagal memuat data: ' + (err.message||err)); });
}

/* ── DB DELETE ── */
function dbDelete(id) {
  if (!confirm('Hapus data PM ini dari database?')) return;
  supaFetch('DELETE', SUPA_TABLE + '?id=eq.' + id)
    .then(function() {
      dbShowToast('Data berhasil dihapus');
      if (typeof dbLoadRiwayat === 'function') dbLoadRiwayat();
    })
    .catch(function(err){ alert('Gagal hapus: ' + (err.message||err)); });
}

/* ── DB SAVE (generic — modul-specific dbCollectData defined per page) ── */
function dbSave(modul, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
  var rec, existingId, callback;
  if (arg6 !== undefined && typeof arg6 === 'object') {
    rec = { modul:modul, tanggal:arg2||null, pic:arg3||null, work_order:arg4||null,
            unit:arg5||'Unit 7', data:arg6, updated_at:new Date().toISOString() };
    existingId = arg7 || window._editingId || null;
    callback = arg8 || null;
  } else {
    if (typeof dbCollectData !== 'function') { alert('dbCollectData tidak ditemukan'); return; }
    rec = dbCollectData(modul);
    if (!rec) return;
    rec.updated_at = new Date().toISOString();
    existingId = (typeof arg2 === 'string' && arg2.length > 10) ? arg2 : (window._editingId || null);
    callback = null;
  }
  var btn = null;
  try { btn = event && event.target && event.target.tagName === 'BUTTON' ? event.target : null; } catch(e){}
  var origText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '⏳ Menyimpan...';
  var path, method;
  if (existingId) {
    path  = SUPA_TABLE + '?id=eq.' + existingId;
    method = 'PATCH';
  } else {
    path  = SUPA_TABLE;
    method = 'POST';
  }
  supaFetch(method, path, rec)
    .then(function(rows) {
      if (btn) btn.innerHTML = origText;
      window._editingId = null;
      dbShowToast(existingId ? '✓ Data berhasil diperbarui!' : '✓ Data berhasil disimpan!');
      if (callback) callback(rows && rows[0] && rows[0].id ? rows[0].id : existingId);
    })
    .catch(function(err) {
      if (btn) btn.innerHTML = origText;
      dbShowToast('✗ Gagal simpan: ' + (err.message || err));
    });
}

/* ── DB LIST (untuk history page) ── */
function dbList(modul, callback) {
  var path = SUPA_TABLE + '?select=id,modul,tanggal,pic,work_order,created_at,updated_at&order=updated_at.desc&limit=100';
  supaFetch('GET', path)
    .then(function(rows) {
      if (!modul) { callback(rows || []); return; }
      var normFilter = normalizeModul(modul);
      var filtered = (rows || []).filter(function(r) {
        return normalizeModul(r.modul) === normFilter;
      });
      callback(filtered);
    })
    .catch(function(){ callback([]); });
}

/* ── NORMALIZE MODUL NAME ── */
function normalizeModul(name) {
  if (!name) return '';
  var n = name.toUpperCase();
  if (n.indexOf('FEGT')>=0 || n.indexOf('LEAK')>=0) return 'FEGT';
  if (n.indexOf('SO2')>=0 || n.indexOf('SCRUBBER')>=0) return 'SO2';
  if (n.indexOf('OPACITY')>=0) return 'OPACITY';
  if (n.indexOf('BELT')>=0 || n.indexOf('CONVEYOR')>=0) {
    if (n.indexOf('E4')>=0 || n.indexOf('E45')>=0 || (n.indexOf('E-4')>=0)) return 'BELT_E45';
    if (n.indexOf('E2')>=0 || n.indexOf('E23')>=0 || (n.indexOf('E-2')>=0)) return 'BELT_E23';
    if (n.indexOf('B1')>=0 || n.indexOf('B12')>=0 || (n.indexOf('B-1')>=0)) return 'BELT_B12';
    return 'BELT';
  }
  if (n.indexOf('MAINTENANCE')>=0 || n.indexOf('REPORT')>=0) return 'MAINTENANCE_REPORT';
  return n;
}

/* ── FILE TYPE HELPERS ── */
var IMG_EXTS = /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif|avif|cr2|nef|arw|orf|rw2|dng|raw|svg)$/i;
var VIDEO_EXTS = /\.(mp4|mov|avi|mkv|webm|m4v)$/i;
var HEIC_EXTS = /\.(heic|heif)$/i;

function isImageFile(file) {
  return IMG_EXTS.test(file.name) || (file.type && file.type.startsWith('image/'));
}
function fileIcon(name) {
  if (IMG_EXTS.test(name)) return '🖼️';
  if (VIDEO_EXTS.test(name)) return '🎥';
  if (/\.pdf$/i.test(name)) return '📄';
  if (/\.(doc|docx)$/i.test(name)) return '📝';
  if (/\.(xls|xlsx)$/i.test(name)) return '📊';
  return '📁';
}

function openFileInputSource(inputId, source) {
  var input = document.getElementById(inputId);
  if (!input) return;
  input.value = '';
  input.removeAttribute('capture');
  if (source === 'camera') {
    input.setAttribute('capture', 'camera');
  }
  input.click();
}

function toggleSourceChoices(elementId) {
  var el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = (el.style.display === 'flex' || el.style.display === 'block') ? 'none' : 'flex';
}

/* ── IMAGE LOADING OVERLAY ── */
function showImgLoading(msg) {
  var el = document.getElementById('imgLoadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'imgLoadingOverlay';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.75);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:15px;gap:12px';
    document.body.appendChild(el);
  }
  el.innerHTML = '<div style="font-size:36px">⏳</div><div>' + (msg||'Memproses gambar...') + '</div>';
  el.style.display = 'flex';
}
function hideImgLoading() {
  var el = document.getElementById('imgLoadingOverlay');
  if (el) el.style.display = 'none';
}

function showHeicWarning() {
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px';
  d.innerHTML = '<div style="background:#fff;border-radius:12px;padding:24px;max-width:320px;width:100%">' +
    '<div style="font-size:16px;font-weight:700;color:#111;margin-bottom:12px">Format HEIC tidak didukung</div>' +
    '<div style="font-size:13px;color:#444;line-height:1.6">Android Chrome tidak bisa membaca file HEIC.<br><br>' +
    '<b>Solusi:</b><br>• Buka foto di Galeri → Share → pilih <b>JPG</b><br>• Atau screenshot foto tersebut<br>• Lalu upload gambar JPG/PNG</div>' +
    '<button onclick="this.parentNode.parentNode.remove()" style="margin-top:16px;width:100%;padding:10px;background:#27ae60;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Mengerti</button>' +
    '</div>';
  document.body.appendChild(d);
}

/* ── IMAGE CONVERTER: file → JPEG dataUrl ── */
function fileToJpegDataUrl(file, callback) {
  showImgLoading('Memproses ' + file.name + '...');
  var url = URL.createObjectURL(file);
  var img = new Image();
  img.onload = function() {
    try {
      var c = document.createElement('canvas');
      c.width = img.naturalWidth || 800;
      c.height = img.naturalHeight || 600;
      c.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      hideImgLoading();
      callback(c.toDataURL('image/jpeg', 0.92));
    } catch(e) {
      URL.revokeObjectURL(url);
      strategy2(file, callback);
    }
  };
  img.onerror = function() {
    URL.revokeObjectURL(url);
    strategy2(file, callback);
  };
  img.src = url;
}

function strategy2(file, callback) {
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      try {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth || 800;
        c.height = img.naturalHeight || 600;
        c.getContext('2d').drawImage(img, 0, 0);
        hideImgLoading();
        callback(c.toDataURL('image/jpeg', 0.92));
      } catch(e) {
        hideImgLoading();
        callback(ev.target.result);
      }
    };
    img.onerror = function() {
      hideImgLoading();
      var ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'heic' || ext === 'heif') { showHeicWarning(); callback(null); }
      else callback(ev.target.result);
    };
    img.src = ev.target.result;
  };
  reader.onerror = function() {
    hideImgLoading();
    alert('Gagal membaca file: ' + file.name);
    callback(null);
  };
  reader.readAsDataURL(file);
}

/* ── CROP ENGINE ── */
function cropLinkSize(changed) {
  var locked = document.getElementById('cropLock').checked;
  if (!locked) return;
  var box = document.getElementById('cropBox');
  var ratio = box.offsetWidth / box.offsetHeight;
  var wEl = document.getElementById('cropOutW'), hEl = document.getElementById('cropOutH');
  if (changed === 'w' && wEl.value) hEl.value = Math.round(parseInt(wEl.value) / ratio);
  else if (changed === 'h' && hEl.value) wEl.value = Math.round(parseInt(hEl.value) * ratio);
}

function cropReset() {
  var img = document.getElementById('cropImg');
  var box = document.getElementById('cropBox');
  var wrap = document.getElementById('cropWrap');
  var ww = wrap.clientWidth, wh = wrap.clientHeight;
  var iw = img.naturalWidth, ih = img.naturalHeight;
  var scale = Math.min(ww/iw, wh/ih, 1);
  img.style.width = (iw*scale)+'px'; img.style.height = (ih*scale)+'px';
  img.style.left = ((ww-iw*scale)/2)+'px'; img.style.top = ((wh-ih*scale)/2)+'px';
  box.style.left = img.style.left; box.style.top = img.style.top;
  box.style.width = (iw*scale)+'px'; box.style.height = (ih*scale)+'px';
  document.getElementById('cropOutW').value = iw;
  document.getElementById('cropOutH').value = ih;
}

function imgOpenCropper(dataUrl, name, type, imgArr, side, modulePrefix, replaceIdx) {
  var modal = document.getElementById('cropModal');
  var cropImg = document.getElementById('cropImg');
  modal._pending = {dataUrl:dataUrl, name:name, type:type, imgArr:imgArr, side:side, modulePrefix:modulePrefix, replaceIdx:(replaceIdx!==undefined?replaceIdx:-1)};

  function initCropBox() {
    var box = document.getElementById('cropBox');
    var wrap = document.getElementById('cropWrap');
    var iw = cropImg.naturalWidth, ih = cropImg.naturalHeight;
    if (!iw || !ih) { iw = 800; ih = 600; }
    var ww = wrap.clientWidth || 300, wh = wrap.clientHeight || 280;
    var scale = Math.min(ww/iw, wh/ih, 1);
    var dw = iw*scale, dh = ih*scale;
    cropImg.style.width = dw+'px'; cropImg.style.height = dh+'px';
    cropImg.style.position = 'absolute';
    cropImg.style.left = ((ww-dw)/2)+'px'; cropImg.style.top = ((wh-dh)/2)+'px';
    box.style.left = cropImg.style.left; box.style.top = cropImg.style.top;
    box.style.width = dw+'px'; box.style.height = dh+'px';
    document.getElementById('cropOutW').value = iw;
    document.getElementById('cropOutH').value = ih;
    document.getElementById('cropNatSize').textContent = iw + ' x ' + ih + ' px';
    initDragCrop(box, wrap);
  }

  cropImg.onload = function() { initCropBox(); };
  cropImg.onerror = function() {
    modal.style.display = 'none';
    imgCompressAndStore(null, name, imgArr, side, modulePrefix, dataUrl);
  };
  modal.style.display = 'flex';
  cropImg.src = ''; cropImg.src = dataUrl;
  if (cropImg.complete && cropImg.naturalWidth) { initCropBox(); }
}

function initDragCrop(box, wrap) {
  var startX, startY, startL, startT, startW, startH, mode;
  box.onmousedown = box.ontouchstart = function(e) {
    e.preventDefault();
    var touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX; startY = touch.clientY;
    startL = parseInt(box.style.left)||0; startT = parseInt(box.style.top)||0;
    startW = box.offsetWidth; startH = box.offsetHeight;
    var bRect = box.getBoundingClientRect();
    var rx = touch.clientX - bRect.left, ry = touch.clientY - bRect.top;
    var edgeX = rx < 16 ? 'l' : rx > startW-16 ? 'r' : '';
    var edgeY = ry < 16 ? 't' : ry > startH-16 ? 'b' : '';
    mode = (edgeX||edgeY) ? edgeX+edgeY : 'move';

    function onMove(ev) {
      var t = ev.touches ? ev.touches[0] : ev;
      var dx = t.clientX - startX, dy = t.clientY - startY;
      var img = document.getElementById('cropImg');
      var iLeft = parseInt(img.style.left)||0, iTop = parseInt(img.style.top)||0;
      var iW = img.offsetWidth, iH = img.offsetHeight;
      if (mode === 'move') {
        var nl = Math.max(iLeft, Math.min(iLeft+iW-startW, startL+dx));
        var nt = Math.max(iTop, Math.min(iTop+iH-startH, startT+dy));
        box.style.left = nl+'px'; box.style.top = nt+'px';
      } else {
        var nl = parseInt(box.style.left)||startL, nt = parseInt(box.style.top)||startT;
        var nw = startW, nh = startH;
        if(mode.includes('r')) nw = Math.max(40, Math.min(iLeft+iW-nl, startW+dx));
        if(mode.includes('b')) nh = Math.max(40, Math.min(iTop+iH-nt, startH+dy));
        if(mode.includes('l')){ nl=Math.max(iLeft,Math.min(startL+startW-40,startL+dx)); nw=startL+startW-nl; }
        if(mode.includes('t')){ nt=Math.max(iTop,Math.min(startT+startH-40,startT+dy)); nh=startT+startH-nt; }
        box.style.left=nl+'px'; box.style.top=nt+'px'; box.style.width=nw+'px'; box.style.height=nh+'px';
      }
    }
    function onUp() {
      document.removeEventListener('mousemove',onMove); document.removeEventListener('touchmove',onMove);
      document.removeEventListener('mouseup',onUp); document.removeEventListener('touchend',onUp);
    }
    document.addEventListener('mousemove',onMove);
    document.addEventListener('touchmove',onMove,{passive:false});
    document.addEventListener('mouseup',onUp);
    document.addEventListener('touchend',onUp);
  };
}

function cropAndSave() {
  var modal = document.getElementById('cropModal');
  var p = modal._pending;
  var img = document.getElementById('cropImg');
  var box = document.getElementById('cropBox');
  var iLeft = parseInt(img.style.left)||0, iTop = parseInt(img.style.top)||0;
  var iW = img.offsetWidth, iH = img.offsetHeight;
  var bLeft = parseInt(box.style.left)||0, bTop = parseInt(box.style.top)||0;
  var bW = box.offsetWidth, bH = box.offsetHeight;
  var scale = img.naturalWidth / iW;
  var sx = (bLeft-iLeft)*scale, sy = (bTop-iTop)*scale;
  var sw = bW*scale, sh = bH*scale;
  var outW = parseInt(document.getElementById('cropOutW').value)||Math.round(sw);
  var outH = parseInt(document.getElementById('cropOutH').value)||Math.round(sh);
  var canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  modal.style.display = 'none';
  var caption = '';
  if (p.replaceIdx >= 0 && p.imgArr[p.replaceIdx]) caption = p.imgArr[p.replaceIdx].caption || '';
  if (p.replaceIdx >= 0) p.imgArr.splice(p.replaceIdx, 1);
  imgCompressAndStore(canvas, p.name, p.imgArr, p.side, p.modulePrefix, null, caption);
}

function skipCrop() {
  var modal = document.getElementById('cropModal');
  var p = modal._pending;
  modal.style.display = 'none';
  var caption = '';
  if (p.replaceIdx >= 0 && p.imgArr[p.replaceIdx]) caption = p.imgArr[p.replaceIdx].caption || '';
  if (p.replaceIdx >= 0) p.imgArr.splice(p.replaceIdx, 1);
  var img2 = new Image();
  img2.onload = function(){
    var c = document.createElement('canvas');
    c.width = img2.naturalWidth; c.height = img2.naturalHeight;
    c.getContext('2d').drawImage(img2,0,0);
    imgCompressAndStore(c, p.name, p.imgArr, p.side, p.modulePrefix, null, caption);
  };
  img2.onerror = function(){ imgCompressAndStore(null, p.name, p.imgArr, p.side, p.modulePrefix, p.dataUrl, caption); };
  img2.src = p.dataUrl;
}

function imgCompressAndStore(canvas, name, imgArr, side, modulePrefix, rawDataUrl, caption) {
  var MAX_TOTAL = 1 * 1024 * 1024;
  var quality = 0.85, dataUrl;
  if (!canvas && rawDataUrl) { dataUrl = rawDataUrl; }
  else if (!canvas) { return; }
  if (canvas) {
    for (var q = quality; q >= 0.25; q -= 0.1) {
      dataUrl = canvas.toDataURL('image/jpeg', q);
      var currentTotal = imgArr.reduce(function(acc,im){return acc+(im.dataUrl?im.dataUrl.length*0.75:0);},0);
      var newSize = dataUrl.length * 0.75;
      if (currentTotal + newSize <= MAX_TOTAL) break;
      if (q <= 0.25) {
        var factor = Math.sqrt(MAX_TOTAL / (currentTotal + newSize));
        var c2 = document.createElement('canvas');
        c2.width = Math.max(100, Math.floor(canvas.width * factor));
        c2.height = Math.max(100, Math.floor(canvas.height * factor));
        c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
        dataUrl = c2.toDataURL('image/jpeg', 0.7);
        break;
      }
    }
  }
  imgArr.push({name: name.replace(/\.[^.]+$/, '.jpg'), dataUrl: dataUrl, type: 'image/jpeg', caption: caption||''});
  if (modulePrefix === 'op') { opRenderPreviews(side); updateSizeIndicator('op', side); }
  else if (modulePrefix === 'bs') { bsRenderPreviews(side); updateSizeIndicator('bs', side); }
}

function updateSizeIndicator(prefix, side) {
  var arr = prefix==='op' ? opImages[side] : bsImages[side];
  var total = arr.reduce(function(acc,im){return acc+(im.dataUrl?im.dataUrl.length*0.75:0);},0);
  var kb = (total/1024).toFixed(0);
  var color = total > 900*1024 ? '#e74c3c' : total > 700*1024 ? '#f39c12' : 'var(--text3)';
  var el = document.getElementById(prefix+'SizeInfo'+side);
  if(el){ el.textContent = kb+' KB / 1024 KB'; el.style.color = color; }
}
