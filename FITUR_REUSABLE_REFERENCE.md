# Fitur Reusable — Referensi dari `maintenance_report_form.html`

> **Cara pakai dokumen ini (untuk Claude):** Saat user upload HTML lain dan minta salah satu/semua fitur di bawah diterapkan:
> 1. Baca dulu file yang diupload SECARA UTUH — cek struktur tabel/checksheet dan CSS/tema warnanya. **JANGAN diubah/disentuh.**
> 2. Untuk tiap fitur yang diminta: cek apakah file itu SUDAH punya fitur serupa (mis. sudah ada crop modal versi lama dari `shared.js` — lihat bagian "⚠️ Potensi Konflik" di tiap fitur). Kalau sudah ada, **gabungkan** (ambil yang kurang, jangan timpa total). Kalau belum ada, tempel kode dari dokumen ini lalu **adaptasi** placeholder (ditandai `{{ }}`) sesuai konteks file itu (nama variabel data, id elemen, dsb).
> 3. Fitur print/PDF: kalau perbedaannya besar (struktur tabel PDF beda total, bukan cuma nambah elemen) → **tanya dulu ke user** sebelum ubah. Kalau cuma nambah (preview, background template, dsb) → langsung kerjakan.
> 4. Kode di bawah ini sudah diringkas — sebelum ditempel, cek ulang nama fungsi & id supaya tidak bentrok dengan yang sudah ada di file tujuan.
> 5. **Struktur form (section collapse, badge counter, add/delete item, sync dom↔state) SENGAJA TIDAK dimasukkan** di dokumen ini — itu ditangani terpisah per file karena strukturnya beda-beda.
> 6. Kalau suatu fitur butuh konfigurasi tambahan yang cuma user yang tahu (nama modul, path file background, dst) — **jangan menebak**, tanyakan/ingatkan ke user apa yang kurang.

**Dependensi umum yang dipakai fitur-fitur di bawah:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script> <!-- kalau butuh tabel -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script> <!-- untuk preview PDF -->
<script src="shared.js"></script>
```
Semua pakai `cdnjs.cloudflare.com` (bukan `unpkg.com`) — sesuai konvensi Tracking-Prevention-safe yang sudah berjalan.

---

## Daftar Fitur
- [A. Upload Gambar (kamera/galeri + convert + HEIC)](#a-upload-gambar)
- [B. Crop Modal 3-Mode (Default / Preset / Manual)](#b-crop-modal-3-mode)
- [C. Crop Ulang (✂️ scissors, re-edit tanpa upload baru)](#c-crop-ulang)
- [D. Geser Posisi Gambar di Hasil PDF (nudge + reflow)](#d-geser-posisi-gambar)
- [E. Drag/Resize Kotak Crop](#e-dragresize-kotak-crop)
- [F. Autosave Draft (pola `shared.js`)](#f-autosave-draft)
- [G. Loading Overlay (riwayat / simpan / export PDF)](#g-loading-overlay)
- [H. Background Template PDF](#h-background-template-pdf)
- [I. Preview PDF Sebelum Download (PDF.js canvas, mobile-safe)](#i-preview-pdf)
- [Checklist Konfigurasi per File Baru](#checklist-konfigurasi)
- [⚠️ Potensi Konflik Global](#potensi-konflik-global)

---

## A. Upload Gambar
**Tujuan:** user pilih sumber foto (kamera langsung / galeri), file dikonversi ke JPEG dataURL, siap dilempar ke crop modal.

**⚠️ Potensi Konflik:** `shared.js` sudah py fungsi serupa: `fileToJpegDataUrl(file, callback)` + `strategy2()` — lebih baik dari versi lokal di bawah karena sudah otomatis panggil `showImgLoading()`/`hideImgLoading()` dan `showHeicWarning()` untuk file HEIC. **Kalau file tujuan sudah manggil `fileToJpegDataUrl` dari shared.js, JANGAN diganti** — biarkan pakai itu. Kode di bawah hanya untuk file yang belum punya converter sama sekali.

```html
<!-- tombol sumber upload -->
<div class="source-choices" id="sourceChoices-{{type}}-{{idx}}" style="display:none">
    <button type="button" onclick="triggerUpload('{{type}}',{{idx}},-1,'camera')">📷 Kamera</button>
    <button type="button" onclick="triggerUpload('{{type}}',{{idx}},-1,'storage')">🖼️ Galeri</button>
</div>
<input type="file" id="fileInput" accept="image/*" style="display:none">
```

```js
function toggleSourceChoices(type, idx) {
    var el = document.getElementById('sourceChoices-'+type+'-'+idx);
    if (!el) return;
    el.style.display = (el.style.display === 'flex' || el.style.display === 'block') ? 'none' : 'flex';
}

function triggerUpload(type, idx, replaceIdx, source) {
    cropModal._pending = {type:type, idx:idx, replaceIdx:replaceIdx};
    var choiceEl = document.getElementById('sourceChoices-'+type+'-'+idx);
    if (choiceEl) choiceEl.style.display = 'none';
    openFileInputSource('fileInput', source || 'storage'); // openFileInputSource ada di shared.js
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    // PAKAI shared.js kalau tersedia:
    if (typeof fileToJpegDataUrl === 'function') {
        fileToJpegDataUrl(file, function(dataUrl) { if (dataUrl) openCropModal(dataUrl); });
        return;
    }
    // fallback lokal (dipakai HANYA kalau shared.js versi lama/tidak punya fileToJpegDataUrl):
    fileToDataUrlLocal(file, function(dataUrl) { if (dataUrl) openCropModal(dataUrl); });
});

function fileToDataUrlLocal(file, callback) {
    var looksLikeImage = file && (/^image\//i.test(file.type||'') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name||''));
    if (!looksLikeImage) { alert('File harus berupa gambar.'); callback(null); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
            try {
                var c = document.createElement('canvas');
                var maxSide = 1800;
                var scale = Math.min(maxSide/(img.naturalWidth||maxSide), maxSide/(img.naturalHeight||maxSide), 1);
                c.width = Math.max(1, Math.round((img.naturalWidth||800)*scale));
                c.height = Math.max(1, Math.round((img.naturalHeight||600)*scale));
                c.getContext('2d').drawImage(img,0,0,c.width,c.height);
                callback(c.toDataURL('image/jpeg', 0.92));
            } catch(e) { callback(ev.target.result); }
        };
        img.onerror = function() {
            var ext = (file.name||'').split('.').pop().toLowerCase();
            if ((ext==='heic'||ext==='heif') && typeof showHeicWarning === 'function') showHeicWarning();
            else alert('Format gambar tidak bisa diproses. Gunakan JPG atau PNG.');
            callback(null);
        };
        img.src = ev.target.result;
    };
    reader.onerror = function() { alert('Gagal membaca file'); callback(null); };
    reader.readAsDataURL(file);
}
```
**Butuh dari user:** tidak ada — otomatis pakai `shared.js` kalau ada.

---

## B. Crop Modal 3-Mode
**Tujuan:** setelah pilih foto, user crop dengan 3 pilihan mode:
- **Default** — langsung 7.2×5.18cm (tidak perlu isi apa-apa)
- **Preset** — pilih rasio (1:1/3:2/4:3/5:4/16:9/A4/Letter) + orientasi Potrait/Lanskap, isi salah satu Panjang/Lebar, sisi lain otomatis mengikuti rasio. Cap: sisi panjang maks 7cm, sisi pendek maks 5cm.
- **Manual** — bebas, kedua sisi maks 7cm.

**⚠️ Potensi Konflik BESAR:** `shared.js` sudah punya crop engine generik sendiri dengan nama fungsi **SAMA PERSIS**: `cropReset()`, `cropAndSave()`, `skipCrop()`, `imgOpenCropper()`. Kalau file tujuan MASIH memanggil `imgOpenCropper(...)` di tombol upload-nya (pola lama, ukuran dalam PIXEL bukan CM, tanpa mode Default/Preset/Manual) — deklarasi fungsi baru di `<script>` inline file itu (dimuat setelah `shared.js`) akan **menimpa** punya `shared.js` secara otomatis karena global function declaration terakhir yang menang. Ini AMAN selama seluruh alur upload di file itu diarahkan ke `openCropModal()` versi baru (bukan campur aduk manggil `imgOpenCropper` di satu tempat dan `openCropModal` di tempat lain). **Cek dulu semua pemanggil crop di file tujuan, ganti semua ke `openCropModal(dataUrl)` / `triggerUpload(...)` versi baru ini secara konsisten.**

```html
<!-- Taruh sebelum </body>, sekali saja per halaman -->
<div id="cropModal">
    <div class="crop-dialog">
        <div class="crop-header">
            <div class="crop-header-title">✂️ Crop Gambar</div>
            <div class="crop-header-hint">Drag pojok/sisi untuk resize • Drag tengah untuk pindah</div>
        </div>
        <div id="cropWrap">
            <img id="cropImg" src="">
            <div id="cropBox">
                <div class="crop-handle nw"></div><div class="crop-handle ne"></div>
                <div class="crop-handle sw"></div><div class="crop-handle se"></div>
                <div class="crop-handle n"></div><div class="crop-handle s"></div>
                <div class="crop-handle w"></div><div class="crop-handle e"></div>
                <div class="crop-grid"></div>
            </div>
        </div>
        <div class="crop-footer">
            <div class="crop-size-panel">
                <div class="crop-size-row" id="cropModeRow">
                    <button type="button" class="crop-mode-btn" id="cropModeDefault" onclick="setCropMode('default')">⭐ Default</button>
                    <button type="button" class="crop-mode-btn" id="cropModePreset" onclick="setCropMode('preset')">▦ Preset</button>
                    <button type="button" class="crop-mode-btn" id="cropModeManual" onclick="setCropMode('manual')">✋ Manual</button>
                </div>
                <div class="crop-default-label" id="cropDefaultLabel" style="display:none">Ukuran: 7.2 × 5.18 cm (default, tidak perlu diatur)</div>
                <div id="cropPresetControls" style="display:none">
                    <div class="crop-size-row" id="cropPresetRow"></div>
                    <div class="crop-size-row" style="margin-top:8px">
                        <button type="button" class="crop-orient-btn" id="cropOrientPotrait" onclick="setCropOrientation('portrait')">⬍ Potrait</button>
                        <button type="button" class="crop-orient-btn" id="cropOrientLandscape" onclick="setCropOrientation('landscape')">⬌ Lanskap</button>
                    </div>
                </div>
                <div class="crop-size-row" id="cropCmRow" style="margin-top:8px;display:none">
                    <div class="crop-cm-field"><label>Panjang (cm)</label><input type="number" id="cropWcm" min="0.5" max="7" step="0.1" value="5" oninput="onCustomCmChange('w')"></div>
                    <div class="crop-cm-field"><label>Lebar (cm)</label><input type="number" id="cropHcm" min="0.5" max="7" step="0.1" value="5" oninput="onCustomCmChange('h')"></div>
                    <div class="crop-size-label" id="cropSizeLabel">Bebas (ukuran default saat cetak)</div>
                </div>
            </div>
            <div class="crop-btns">
                <button class="crop-btn crop-btn-outline" onclick="cropReset()">↺ Reset</button>
                <button class="crop-btn crop-btn-outline" onclick="closeCropModal()">Batal</button>
                <button class="crop-btn crop-btn-save" onclick="cropAndSave()">✓ Simpan</button>
            </div>
        </div>
    </div>
</div>
```

```css
/* Struktural saja — sesuaikan warna (#1a221e dkk) ke tema file tujuan kalau perlu */
#cropModal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.85);flex-direction:column;align-items:center;justify-content:center;padding:12px}
#cropModal.show{display:flex}
.crop-dialog{background:#1a221e;border:1px solid #2a3a30;border-radius:10px;width:min(96vw,540px);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
.crop-header{background:#243228;padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.crop-header-title{font-weight:700;font-size:13px;color:#e0f0e8;letter-spacing:0.5px}
.crop-header-hint{font-size:10px;color:#8aab96}
#cropWrap{position:relative;width:100%;height:min(55vw,320px);background:#111;overflow:hidden;user-select:none;-webkit-user-select:none}
#cropImg{position:absolute;max-width:none;pointer-events:none;display:block}
#cropBox{position:absolute;border:2px solid #2ecc71;box-shadow:0 0 0 9999px rgba(0,0,0,0.45);cursor:move;touch-action:none;min-width:40px;min-height:40px}
.crop-handle{position:absolute;width:12px;height:12px;background:#2ecc71;border-radius:2px}
.crop-handle.nw{top:-6px;left:-6px;cursor:nw-resize} .crop-handle.ne{top:-6px;right:-6px;cursor:ne-resize}
.crop-handle.sw{bottom:-6px;left:-6px;cursor:sw-resize} .crop-handle.se{bottom:-6px;right:-6px;cursor:se-resize}
.crop-handle.n{width:10px;height:10px;top:-5px;left:50%;transform:translateX(-50%);cursor:n-resize}
.crop-handle.s{width:10px;height:10px;bottom:-5px;left:50%;transform:translateX(-50%);cursor:s-resize}
.crop-handle.w{width:10px;height:10px;left:-5px;top:50%;transform:translateY(-50%);cursor:w-resize}
.crop-handle.e{width:10px;height:10px;right:-5px;top:50%;transform:translateY(-50%);cursor:e-resize}
.crop-grid{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:
  repeating-linear-gradient(0deg,transparent,transparent 33.3%,rgba(255,255,255,0.08) 33.3%,rgba(255,255,255,0.08) 33.4%,transparent 33.4%,transparent 66.6%,rgba(255,255,255,0.08) 66.6%,rgba(255,255,255,0.08) 66.7%,transparent 66.7%),
  repeating-linear-gradient(90deg,transparent,transparent 33.3%,rgba(255,255,255,0.08) 33.3%,rgba(255,255,255,0.08) 33.4%,transparent 33.4%,transparent 66.6%,rgba(255,255,255,0.08) 66.6%,rgba(255,255,255,0.08) 66.7%,transparent 66.7%)}
.crop-footer{padding:10px 14px;background:#1a221e;border-top:1px solid #2a3a30}
.crop-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.crop-btn{padding:7px 16px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}
.crop-btn-outline{background:transparent;border:1px solid #4a6a55;color:#aac8b5}
.crop-btn-save{background:#2ecc71;color:#fff}
.crop-size-panel{border-top:1px solid #2a3a30;padding-top:8px;margin-top:2px}
.crop-size-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.crop-preset-btn,.crop-orient-btn,.crop-mode-btn{padding:5px 10px;border-radius:6px;border:1px solid #3a4f42;background:#222e26;color:#aac8b5;font-size:11px;font-weight:600;cursor:pointer}
.crop-preset-btn.active,.crop-orient-btn.active,.crop-mode-btn.active{background:#2ecc71;color:#0e150f;border-color:#2ecc71}
.crop-mode-btn{padding:6px 12px;font-size:12px}
.crop-cm-field{display:flex;flex-direction:column;gap:2px}
.crop-cm-field label{font-size:9px;color:#8aab96;font-weight:600}
.crop-cm-field input{width:64px;padding:5px 6px;font-size:12px;border-radius:5px;border:1px solid #3a4f42;background:#0f1512;color:#e0f0e8}
.crop-size-label{font-size:11px;color:#7fd9a4;font-weight:600;margin-left:4px}
.crop-default-label{font-size:12px;color:#7fd9a4;font-weight:600;padding:4px 2px}
```

```js
// ── STATE (tambahkan ke deklarasi state utama file) ──
var cropModal = document.getElementById('cropModal');
cropModal._pending = null;
cropModal._ratioLocked = false;
cropModal._cropWcm = null;
cropModal._cropHcm = null;
cropModal._orientation = 'portrait';
cropModal._activePresetIdx = -1;
cropModal._mode = 'default';
cropModal._presetRatio = 1;

var DEFAULT_CROP_W_CM = 7.2, DEFAULT_CROP_H_CM = 5.18;
var PRESET_DEFAULT_LONG_CM = 4;
var MANUAL_MAX_CM = 7;
var CROP_PRESETS = [
    {label:'1:1', w:1, h:1}, {label:'3:2', w:3, h:2}, {label:'4:3', w:4, h:3},
    {label:'5:4', w:5, h:4}, {label:'16:9', w:16, h:9}, {label:'A4', w:210, h:297}, {label:'Letter', w:216, h:279}
];

function renderPresetButtons() {
    var row = document.getElementById('cropPresetRow');
    if (!row) return;
    row.innerHTML = '';
    CROP_PRESETS.forEach(function(p, i) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'crop-preset-btn'; btn.id = 'cropPreset-'+i;
        btn.textContent = p.label; btn.onclick = function () { applyPreset(i); };
        row.appendChild(btn);
    });
}
function highlightPreset(activeIdx) {
    CROP_PRESETS.forEach(function (p, idx) {
        var btn = document.getElementById('cropPreset-'+idx);
        if (btn) btn.classList.toggle('active', idx === activeIdx);
    });
}
function getMaxForField(field) {
    if (cropModal._mode === 'preset') {
        var longMax=7, shortMax=5;
        if (cropModal._orientation === 'landscape') return field==='w' ? longMax : shortMax;
        return field==='w' ? shortMax : longMax;
    }
    if (cropModal._mode === 'manual') return MANUAL_MAX_CM;
    return 99;
}
function clampCmValue(v, maxV) {
    v = parseFloat(v);
    if (!isFinite(v) || v<=0) v=0.5;
    if (v>maxV) v=maxV;
    if (v<0.5) v=0.5;
    return Math.round(v*10)/10;
}
function setCropMode(mode) {
    cropModal._mode = mode;
    ['Default','Preset','Manual'].forEach(function(m){
        var b = document.getElementById('cropMode'+m);
        if (b) b.classList.toggle('active', mode === m.toLowerCase());
    });
    var presetControls = document.getElementById('cropPresetControls');
    var cmRow = document.getElementById('cropCmRow');
    var defaultLabel = document.getElementById('cropDefaultLabel');
    if (mode === 'default') {
        presetControls.style.display='none'; cmRow.style.display='none'; defaultLabel.style.display='block';
        highlightPreset(-1); applyDefaultSize();
    } else if (mode === 'preset') {
        presetControls.style.display='block'; cmRow.style.display='flex'; defaultLabel.style.display='none';
        applyPreset(cropModal._activePresetIdx < 0 ? 0 : cropModal._activePresetIdx);
    } else {
        presetControls.style.display='none'; cmRow.style.display='flex'; defaultLabel.style.display='none';
        highlightPreset(-1);
        setFreeSize(cropModal._cropWcm||5, cropModal._cropHcm||5);
    }
}
function applyDefaultSize() {
    cropModal._ratioLocked = true;
    cropModal._cropWcm = DEFAULT_CROP_W_CM; cropModal._cropHcm = DEFAULT_CROP_H_CM;
    updateSizeLabel(); reshapeCropBoxToRatio();
}
function applyPreset(i) {
    var p = CROP_PRESETS[i];
    var ratioValue = Math.max(p.w,p.h) / Math.min(p.w,p.h);
    cropModal._activePresetIdx = i;
    var longSide = PRESET_DEFAULT_LONG_CM;
    var shortSide = Math.round((longSide/ratioValue)*10)/10;
    var w,h;
    if (cropModal._orientation === 'landscape') { w=longSide; h=shortSide; } else { h=longSide; w=shortSide; }
    cropModal._presetRatio = w/h;
    setLockedSize(w,h); highlightPreset(i);
}
function setCropOrientation(orientation) {
    cropModal._orientation = orientation;
    document.getElementById('cropOrientPotrait').classList.toggle('active', orientation==='portrait');
    document.getElementById('cropOrientLandscape').classList.toggle('active', orientation==='landscape');
    var w = cropModal._cropWcm||1, h = cropModal._cropHcm||1;
    var longVal=Math.max(w,h), shortVal=Math.min(w,h), neww, newh;
    if (orientation==='landscape') { neww=longVal; newh=shortVal; } else { newh=longVal; neww=shortVal; }
    cropModal._presetRatio = neww/newh;
    setLockedSize(neww, newh);
}
function onCustomCmChange(field) {
    if (cropModal._mode === 'preset') { onPresetFieldChange(field); return; }
    if (cropModal._mode === 'manual') {
        var w = clampCmValue(document.getElementById('cropWcm').value, getMaxForField('w'));
        var h = clampCmValue(document.getElementById('cropHcm').value, getMaxForField('h'));
        document.getElementById('cropWcm').value = w; document.getElementById('cropHcm').value = h;
        setFreeSize(w, h, true);
    }
}
function onPresetFieldChange(field) {
    var ratio = cropModal._presetRatio || 1;
    var wEl=document.getElementById('cropWcm'), hEl=document.getElementById('cropHcm');
    var w,h;
    if (field==='w') { w=parseFloat(wEl.value)||0.5; h=w/ratio; } else { h=parseFloat(hEl.value)||0.5; w=h*ratio; }
    var maxW=getMaxForField('w'), maxH=getMaxForField('h');
    var scale = Math.min(1, maxW/w, maxH/h); w*=scale; h*=scale;
    if (w<0.5) { w=0.5; h=w/ratio; }
    if (h<0.5) { h=0.5; w=h*ratio; }
    w=Math.round(w*10)/10; h=Math.round(h*10)/10;
    wEl.value=w; hEl.value=h;
    cropModal._ratioLocked=true; cropModal._cropWcm=w; cropModal._cropHcm=h;
    updateSizeLabel(); reshapeCropBoxToRatio();
}
function setLockedSize(w,h,skipInputSync) {
    w=clampCmValue(w,getMaxForField('w')); h=clampCmValue(h,getMaxForField('h'));
    cropModal._ratioLocked=true; cropModal._cropWcm=w; cropModal._cropHcm=h;
    if (!skipInputSync) { document.getElementById('cropWcm').value=w; document.getElementById('cropHcm').value=h; }
    updateSizeLabel(); reshapeCropBoxToRatio();
}
function setFreeSize(w,h,skipInputSync) {
    w=clampCmValue(w,getMaxForField('w')); h=clampCmValue(h,getMaxForField('h'));
    cropModal._ratioLocked=false; cropModal._cropWcm=w; cropModal._cropHcm=h;
    if (!skipInputSync) { document.getElementById('cropWcm').value=w; document.getElementById('cropHcm').value=h; }
    updateSizeLabel();
}
function updateSizeLabel() {
    var lbl = document.getElementById('cropSizeLabel'); if (!lbl) return;
    var w=cropModal._cropWcm, h=cropModal._cropHcm;
    lbl.textContent = cropModal._mode==='preset'
        ? 'Ukuran cetak: '+w+' cm × '+h+' cm (rasio terkunci)'
        : 'Ukuran cetak: '+w+' cm × '+h+' cm (bebas, maks '+MANUAL_MAX_CM+'×'+MANUAL_MAX_CM+'cm)';
}

// openCropModal, cropReset, closeCropModal, cropAndSave, reshapeCropBoxToRatio → lihat file
// maintenance_report_form.html baris ~795-935 untuk kode utuhnya (termasuk kompresi
// adaptif total-cap 1MB — sudah dipastikan bagus, jangan diringkas ulang, salin langsung).

// INIT (panggil di DOMContentLoaded):
// renderPresetButtons();
// initCropDrag(); // lihat fitur E
```

**Butuh dari user saat integrasi:**
- Apakah file tujuan MASIH pakai crop engine lama shared.js (`imgOpenCropper`)? Kalau iya, semua pemanggilnya perlu diarahkan ulang ke `openCropModal()`.
- Apakah ukuran default 7.2×5.18cm masih relevan untuk jenis dokumen file itu, atau beda?

---

## C. Crop Ulang
**Tujuan:** ikon ✂️ di pojok kiri-atas tiap thumbnail — buka lagi crop modal pakai foto yang SUDAH tersimpan (bukan upload baru), lengkap dengan mode/ukuran terakhir.

```html
<button class="reedit" onclick="reEditCrop('{{type}}',{{idx}},{{imgIdx}})" title="Crop ulang">✂️</button>
```
```css
.img-thumb .reedit{position:absolute;top:-7px;left:-7px;width:20px;height:20px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;font-size:11px;line-height:20px;text-align:center;padding:0}
```
```js
function reEditCrop(type, idx, imgIdx) {
    var img = sections[type] && sections[type][idx] && sections[type][idx].images[imgIdx]; // {{sesuaikan struktur data}}
    if (!img || !img.dataUrl) return;
    cropModal._pending = {type:type, idx:idx, replaceIdx:imgIdx};
    var preferredSize = (img.widthCm && img.heightCm) ? {w: img.widthCm, h: img.heightCm} : null;
    openCropModal(img.dataUrl, preferredSize);
}
// openCropModal butuh parameter ke-2 opsional `preferredSize` — pastikan fungsi
// openCropModal di file tujuan sudah menerima ini (lihat Fitur B).
```
**Butuh dari user:** nama variabel/struktur data gambar di file itu (kalau bukan `sections[type][idx].images[]`).

---

## D. Geser Posisi Gambar
**Tujuan:** kontrol ◀▶ di bawah tiap thumbnail untuk menggeser posisi horizontal gambar itu di HASIL PDF (bukan di form), dengan reflow otomatis supaya gambar sesudahnya di baris yang sama ikut ke-push (tidak tumpang tindih).

```html
<div class="img-nudge">
    <div class="img-nudge-label">Geser posisi di hasil PDF</div>
    <div class="img-nudge-controls">
        <button type="button" onclick="nudgeImage('{{type}}',{{idx}},{{imgIdx}},-0.5)" title="Geser posisi gambar ini ke kiri di hasil PDF">◀</button>
        <span>{{img.offsetX||0}}cm</span>
        <button type="button" onclick="nudgeImage('{{type}}',{{idx}},{{imgIdx}},0.5)" title="Geser posisi gambar ini ke kanan di hasil PDF">▶</button>
    </div>
</div>
```
```css
.img-nudge{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:4px}
.img-nudge-label{font-size:8px;color:#8a8a8a;text-align:center;line-height:1.2;max-width:78px}
.img-nudge-controls{display:flex;align-items:center;justify-content:center;gap:3px}
.img-nudge button{width:18px;height:18px;border-radius:4px;border:1px solid #ddd;background:#f2f2f2;color:#333;font-size:9px;cursor:pointer;padding:0;line-height:1}
.img-nudge span{font-size:9px;color:#666;min-width:28px;text-align:center}
```
```js
function nudgeImage(type, idx, imgIdx, delta) {
    var img = sections[type] && sections[type][idx] && sections[type][idx].images[imgIdx]; // {{sesuaikan struktur data}}
    if (!img) return;
    var next = Math.round(((img.offsetX||0)+delta)*10)/10;
    var LIMIT = 5;
    if (next>LIMIT) next=LIMIT; if (next<-LIMIT) next=-LIMIT;
    img.offsetX = next;
    renderSection(type, type+'Box'); // {{ganti ke fungsi render ulang thumbnail file itu}}
}
```

**⚠️ WAJIB juga diubah di sisi generate PDF** (kode gambar di dalam loop `doc.addImage(...)`):
```js
// Sebelumnya: doc.addImage(im.dataUrl, 'JPEG', rowX, y, imgW, imgH);
// Ganti jadi:
var drawX = rowX + ((im.offsetX || 0) * 10);
drawX = Math.max(marginX, Math.min(drawX, pw - marginX - imgW));
doc.addImage(im.dataUrl, 'JPEG', drawX, y, imgW, imgH);
// ...caption pakai drawX juga (bukan rowX)...

// PENTING — baris increment posisi gambar SELANJUTNYA harus pakai drawX, bukan rowX lama,
// supaya reflow-nya jalan (ini yang kemarin jadi bug "gambar ketumpuk"):
rowX = drawX + imgW + gap;   // BUKAN: rowX += imgW + gap;
```
**Butuh dari user:** lokasi persis loop `doc.addImage` gambar di fungsi export PDF file tujuan (tiap file kemungkinan beda nama variabel `rowX`/`gap`/`marginX`).

---

## E. Drag/Resize Kotak Crop
**Tujuan:** geser kotak crop dengan drag tengah, resize dari 8 handle (4 sudut + 4 sisi), rasio terkunci kalau mode Default/Preset aktif.

**Catatan gaya kode:** implementasi ini pakai `mousedown`+`touchstart` manual (bukan Pointer Events `setPointerCapture` seperti pola `opacity.html`). Fungsinya sudah teruji jalan baik touch maupun mouse. **Kalau user minta diseragamkan ke pola Pointer Events, tanyakan dulu** sebelum ganti — jangan otomatis diubah karena risiko bug drag/resize kalau tidak dites ulang.

```js
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function initCropDrag() {
    var box = document.getElementById('cropBox');
    var wrap = document.getElementById('cropWrap');
    box.addEventListener('mousedown', onStart, false);
    box.addEventListener('touchstart', onStart, {passive: false});
    function onStart(e) {
        e.preventDefault(); e.stopPropagation();
        var t = e.touches ? e.touches[0] : e;
        var startX=t.clientX, startY=t.clientY;
        var startL=parseInt(box.style.left)||0, startT=parseInt(box.style.top)||0;
        var startW=box.offsetWidth, startH=box.offsetHeight;
        var rect=box.getBoundingClientRect();
        var rx=t.clientX-rect.left, ry=t.clientY-rect.top, edge=22;
        var edgeX = rx<edge?'l':rx>startW-edge?'r':'';
        var edgeY = ry<edge?'t':ry>startH-edge?'b':'';
        var mode = (edgeX||edgeY) ? edgeX+edgeY : 'move';
        function onMove(ev) {
            ev.preventDefault();
            var mv = ev.touches?ev.touches[0]:ev;
            var dx=mv.clientX-startX, dy=mv.clientY-startY;
            var img=document.getElementById('cropImg');
            var iL=parseInt(img.style.left)||0, iT=parseInt(img.style.top)||0;
            var iW=img.offsetWidth, iH=img.offsetHeight;
            if (mode==='move') {
                box.style.left = clamp(startL+dx, iL, iL+iW-startW)+'px';
                box.style.top = clamp(startT+dy, iT, iT+iH-startH)+'px';
            } else if (cropModal._ratioLocked && cropModal._cropWcm && cropModal._cropHcm) {
                var ratio = cropModal._cropWcm / cropModal._cropHcm;
                var growRight=mode.includes('r'), growLeftEdge=mode.includes('l');
                var growBottom=mode.includes('b'), growTopEdge=mode.includes('t');
                var isCorner = mode.length===2;
                var anchorX = growLeftEdge ? (startL+startW) : startL;
                var anchorY = growTopEdge ? (startT+startH) : startT;
                var dxSigned = growRight?dx:(growLeftEdge?-dx:0);
                var dySigned = growBottom?dy:(growTopEdge?-dy:0);
                var newW,newH;
                if (isCorner) {
                    if (Math.abs(dxSigned)>=Math.abs(dySigned)) { newW=startW+dxSigned; newH=newW/ratio; }
                    else { newH=startH+dySigned; newW=newH*ratio; }
                } else if (growLeftEdge||growRight) { newW=startW+dxSigned; newH=newW/ratio; }
                else { newH=startH+dySigned; newW=newH*ratio; }
                if (newW<40) { newW=40; newH=newW/ratio; }
                if (newH<40) { newH=40; newW=newH*ratio; }
                var maxW = growLeftEdge?(anchorX-iL):(iL+iW-anchorX);
                var maxH = growTopEdge?(anchorY-iT):(iT+iH-anchorY);
                var scaleDown = Math.min(1, maxW>0?maxW/newW:1, maxH>0?maxH/newH:1);
                newW*=scaleDown; newH*=scaleDown;
                var nl,nt;
                if (isCorner||growLeftEdge||growRight) nl = growLeftEdge?(anchorX-newW):anchorX;
                else nl = startL+(startW-newW)/2;
                if (isCorner||growTopEdge||growBottom) nt = growTopEdge?(anchorY-newH):anchorY;
                else nt = startT+(startH-newH)/2;
                box.style.left=nl+'px'; box.style.top=nt+'px'; box.style.width=newW+'px'; box.style.height=newH+'px';
            }
            // kalau TIDAK ratio-locked (mode Manual): resize bebas — lihat file asli baris ~1010-1046
            // untuk cabang else lengkapnya (belum termasuk di ringkasan ini, salin dari sana).
        }
        function onUp() {
            document.removeEventListener('mousemove',onMove); document.removeEventListener('touchmove',onMove);
            document.removeEventListener('mouseup',onUp); document.removeEventListener('touchend',onUp);
        }
        document.addEventListener('mousemove',onMove);
        document.addEventListener('touchmove',onMove,{passive:false});
        document.addEventListener('mouseup',onUp);
        document.addEventListener('touchend',onUp);
    }
}
```
> ⚠️ Cabang resize bebas (mode Manual, tidak ratio-locked) sengaja tidak diringkas di sini karena cukup panjang — **salin langsung dari `maintenance_report_form.html` baris ±1010–1046** saat implementasi supaya tidak ada logika yang kelewat/salah ketik.

---

## F. Autosave Draft
**Tujuan:** form otomatis tersimpan (IndexedDB via `shared.js`) tiap kali ada perubahan input, supaya tidak hilang kalau tab/halaman tertutup tidak sengaja. Saat dibuka lagi, ada prompt "lanjutkan draft?".

Mekanismenya **sudah otomatis jalan dari `shared.js`** (event delegation input/change global + `autosaveCheckAndPrompt` di `window.load`). File tujuan HANYA perlu 2 hal:

```js
window.CURRENT_MODUL = '{{Nama Modul Persis Sama Dengan Yang Dipakai di dbSave()}}';

function restoreDraftData(rec, editingId) {
    if (!rec) return;
    applyRecordToForm(rec); // {{buat fungsi ini: isi ulang semua field dari `rec`, mirror logic dari fungsi load-by-id yang sudah ada di file itu}}
    if (editingId) window._editingId = editingId;
    if (typeof dbShowToast === 'function') dbShowToast('Draft sebelumnya berhasil dipulihkan ✓');
}
```
Draft otomatis kehapus sendiri lewat `autosaveClear()` di dalam `dbSave()` bawaan `shared.js` — **tidak perlu bikin wrapper tombol Simpan sendiri**, biarkan `onclick="dbSave('{{Nama Modul}}')"` langsung seperti biasa.

**Butuh dari user (WAJIB ditanya, jangan menebak):**
- Nama modul persis (harus sama dengan yang dipakai di pemanggilan `dbSave(modul)`/`dbCollectData(modul)` yang sudah ada di file itu, supaya `normalizeModul()` di shared.js mengenalinya).
- Bentuk objek `rec` yang dikembalikan `dbCollectData(modul)` di file itu (field-field apa saja) — dipakai untuk menulis `applyRecordToForm`.

---

## G. Loading Overlay
**Tujuan:** kasih tahu user progres saat proses yang bisa lama (banyak gambar).

- **Ambil dari riwayat & Simpan ke database** → **otomatis** dari `shared.js` (`dbLoad`/`dbSave` sudah include `dbShowSavingOverlay(...)` dengan pesan "Data/Mengupload banyak gambar membutuhkan waktu yang lama"). Tidak perlu kode tambahan — asal file tujuan memang manggil `dbLoad()`/`dbSave()` langsung dari shared.js.
- **Export PDF** → PERLU ditambah manual (shared.js tidak tahu kapan proses PDF mulai/selesai):
```js
function exportPdf() {
    // ...
    var totalImgs = {{hitung total semua gambar di semua section}};
    var loadingMsg = totalImgs>0 ? '⏳ Membuat PDF... memproses '+totalImgs+' gambar, mohon tunggu' : '⏳ Membuat PDF, mohon tunggu';
    if (typeof showImgLoading === 'function') showImgLoading(loadingMsg);
    // ...generate PDF...
    if (typeof hideImgLoading === 'function') hideImgLoading(); // panggil SEBELUM showPdfPreview(...) dan juga di blok catch(err)
}
```
**Butuh dari user:** tidak ada, tapi cek dulu apakah file tujuan sudah manggil `dbLoad`/`dbSave` langsung (bukan versi custom sendiri) — kalau custom, overlay otomatis ini tidak akan jalan.

---

## H. Background Template PDF
**Tujuan:** PDF hasil export pakai gambar background/kop-surat template, di-preload sekali supaya tidak lambat/kedip tiap halaman baru.

```js
var reportBgImg = null, reportBgReady = false, reportBgCallbacks = [];
function initReportBackground() {
    if (reportBgImg) return;
    reportBgImg = new Image();
    reportBgImg.onload = function() { reportBgReady = true; reportBgCallbacks.splice(0).forEach(function(cb){cb();}); };
    reportBgImg.onerror = function() { reportBgReady = false; reportBgCallbacks.splice(0).forEach(function(cb){cb();}); };
    reportBgImg.src = '{{PATH_FILE_BACKGROUND.jpg}}';
}
function ensureReportBackground(callback) {
    initReportBackground();
    if (reportBgReady || (reportBgImg && reportBgImg.complete && reportBgImg.naturalWidth)) { reportBgReady = true; callback(); return; }
    reportBgCallbacks.push(callback);
}
function drawPdfBackground(doc, pw, ph) {
    if (!reportBgImg || !reportBgReady) return;
    try { doc.addImage(reportBgImg, 'JPEG', 0, 0, pw, ph); } catch(e) {}
}
// Panggil initReportBackground() di DOMContentLoaded.
// Bungkus isi exportPdf() di dalam ensureReportBackground(function(){ ...generate PDF... });
// Panggil drawPdfBackground(doc,pw,ph) tiap kali habis doc.addPage().
```
**Butuh dari user:** path/nama file gambar template untuk file itu (kalau beda dari `DRAFT PM KOSONG.jpg`), dan apakah `marginTop` perlu disesuaikan supaya tidak menabrak area kop background (pola b12: `marginTop=20`).

---

## I. Preview PDF
**Tujuan:** sebelum benar-benar download, PDF hasil generate ditampilkan dulu ke user buat dicek. **Dirender manual via PDF.js ke `<canvas>`, BUKAN `<iframe>`** — karena Chrome Android tidak bisa render PDF inline di iframe (cuma nongol kartu "Buka" bawaan Chrome).

```html
<div id="pdfPreviewModal" class="pdf-preview-modal">
    <div class="pdf-preview-dialog">
        <div class="pdf-preview-header">
            <div class="pdf-preview-title">📄 Preview Hasil PDF</div>
            <div class="pdf-preview-hint">Ini tampilan asli file PDF-nya, cek dulu sebelum download</div>
        </div>
        <div class="pdf-preview-body"><div id="pdfPreviewFrame" class="pdf-canvas-container"></div></div>
        <div class="pdf-preview-footer">
            <button class="crop-btn crop-btn-outline" onclick="closePdfPreview()">✏️ Tutup, Edit Lagi</button>
            <button class="crop-btn crop-btn-save" onclick="confirmDownloadPdf()">⬇ Download PDF</button>
        </div>
    </div>
</div>
```
```css
.pdf-preview-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.85);flex-direction:column;align-items:center;justify-content:center;padding:12px}
.pdf-preview-modal.show{display:flex}
.pdf-preview-dialog{background:#1a221e;border:1px solid #2a3a30;border-radius:10px;width:min(96vw,900px);height:min(92vh,1100px);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column}
.pdf-preview-header{background:#243228;padding:10px 16px;flex:0 0 auto}
.pdf-preview-title{font-weight:700;font-size:14px;color:#e0f0e8}
.pdf-preview-hint{font-size:11px;color:#8aab96;margin-top:2px}
.pdf-preview-body{flex:1 1 auto;background:#333;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
.pdf-canvas-container{display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px}
.pdf-canvas-container canvas{max-width:100%;height:auto;box-shadow:0 2px 10px rgba(0,0,0,0.5);background:#fff}
.pdf-canvas-loading{color:#8aab96;font-size:13px;padding:40px 0;text-align:center}
.pdf-preview-footer{padding:10px 14px;background:#1a221e;border-top:1px solid #2a3a30;display:flex;gap:8px;justify-content:flex-end;flex:0 0 auto}
```
```js
var pdfPreviewState = { doc: null, filename: '', blobUrl: '' };
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
function showPdfPreview(doc, filename) {
    if (pdfPreviewState.blobUrl) { URL.revokeObjectURL(pdfPreviewState.blobUrl); pdfPreviewState.blobUrl=''; }
    pdfPreviewState.doc = doc; pdfPreviewState.filename = filename;
    var modal = document.getElementById('pdfPreviewModal');
    var container = document.getElementById('pdfPreviewFrame');
    container.innerHTML = '<div class="pdf-canvas-loading">⏳ Menyiapkan preview...</div>';
    modal.classList.add('show');
    if (typeof pdfjsLib === 'undefined') {
        container.innerHTML = '<div class="pdf-canvas-loading">Preview tidak tersedia di browser ini.<br>Silakan langsung download untuk melihat hasilnya.</div>';
        return;
    }
    var arrayBuffer = doc.output('arraybuffer');
    pdfjsLib.getDocument({data: arrayBuffer}).promise.then(function(pdf) {
        container.innerHTML = '';
        function renderPage(pageNum) {
            pdf.getPage(pageNum).then(function(page) {
                var viewport = page.getViewport({scale: 1.8});
                var canvas = document.createElement('canvas');
                canvas.width = viewport.width; canvas.height = viewport.height;
                container.appendChild(canvas);
                page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).promise.then(function() {
                    if (pageNum < pdf.numPages) renderPage(pageNum+1);
                });
            });
        }
        renderPage(1);
    }).catch(function(err) {
        console.error(err);
        container.innerHTML = '<div class="pdf-canvas-loading">Gagal menampilkan preview.<br>Silakan langsung download untuk melihat hasilnya.</div>';
    });
}
function confirmDownloadPdf() { if (pdfPreviewState.doc) pdfPreviewState.doc.save(pdfPreviewState.filename); }
function closePdfPreview() {
    document.getElementById('pdfPreviewModal').classList.remove('show');
    document.getElementById('pdfPreviewFrame').innerHTML = '';
    if (pdfPreviewState.blobUrl) { URL.revokeObjectURL(pdfPreviewState.blobUrl); pdfPreviewState.blobUrl=''; }
    pdfPreviewState.doc = null;
}
```
**Integrasi ke `exportPdf()` yang sudah ada:** ganti baris terakhir `doc.save(fn)` menjadi `showPdfPreview(doc, fn);` — **ini yang termasuk kategori "fitur print sangat berbeda" kalau file tujuan SELAMA INI langsung download tanpa preview sama sekali. Tanyakan dulu ke user apakah mau diubah jadi alur preview**, karena ini mengubah behavior existing (bukan cuma nambah).

**Butuh dari user:** konfirmasi mau diubah ke alur preview-dulu atau tidak (lihat poin 4 aturan di atas dokumen ini).

---

## Checklist Konfigurasi per File Baru
Sebelum menerapkan fitur-fitur di atas ke file baru, ini yang perlu dicek/ditanyakan:

| # | Yang perlu dipastikan | Kalau tidak ada di prompt user |
|---|---|---|
| 1 | Nama variabel/struktur data gambar (pengganti `sections[type][idx].images[]`) | Baca langsung dari kode file yang diupload |
| 2 | Nama fungsi render ulang thumbnail (pengganti `renderSection(type, boxId)`) | Baca langsung dari kode file yang diupload |
| 3 | `window.CURRENT_MODUL` — nama modul persis untuk autosave | **Tanya user**, jangan menebak |
| 4 | Path file gambar background PDF (kalau beda dari `DRAFT PM KOSONG.jpg`) | **Tanya user** |
| 5 | Apakah file itu masih pakai crop engine lama `shared.js` (`imgOpenCropper`) | Cek kode — kalau ya, perlu migrasi konsisten (lihat Fitur B) |
| 6 | Apakah file itu sudah punya alur download-langsung tanpa preview | Kalau ya dan mau diubah ke preview-dulu → **tanya user dulu** |
| 7 | Lokasi persis loop `doc.addImage(...)` di fungsi export PDF-nya | Baca langsung dari kode file yang diupload |
| 8 | Bentuk objek `rec`/`dbCollectData(modul)` file itu, untuk `applyRecordToForm` | Baca langsung dari kode file yang diupload |

## ⚠️ Potensi Konflik Global
Karena semua fitur di atas dan fungsi bawaan `shared.js` sama-sama pakai **global function declaration** (bukan modul/namespace), nama-nama berikut **rawan bentrok** kalau file tujuan sudah punya fungsi dengan nama sama tapi perilaku beda:
`cropReset`, `cropAndSave`, `skipCrop`, `imgOpenCropper`, `openCropModal`, `closeCropModal`, `setCropMode`, `setCropOrientation`, `renderPresetButtons`, `highlightPreset`, `printReport`, `exportPdf`, `showPdfPreview`, `nudgeImage`, `reEditCrop`.

**Sebelum menempel kode dari dokumen ini, selalu `grep` dulu nama-nama fungsi di atas pada file tujuan.** Kalau sudah ada dan isinya beda, diskusikan dulu ke user mana yang mau dipakai / digabung, jangan main timpa.
