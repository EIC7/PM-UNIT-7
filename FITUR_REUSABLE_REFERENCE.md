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
- [J. Edit Gambar (Insert Shape: Teks/Panah/Garis/Kotak/Oval)](#j-edit-gambar-insert-shape-teksfoto)
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

**🐛 BUG PENTING yang sudah di-fix — ukuran cm crop tidak dipakai di PDF:**
`cropAndSave()` menyimpan `entry.widthCm`/`entry.heightCm` per foto (sesuai cm yang dipilih user saat crop, termasuk "Default" 7.2×5.18cm) — **tapi di kode generate PDF (bagian yang nge-loop foto before/after ke `doc.addImage`), nilai ini SERING DIABAIKAN begitu saja**, diganti kotak grid seragam yang dihitung dari lebar kolom halaman (mis. `fw = (colW-gap/2)/perRow-2`). Akibatnya foto "Default 7.2×5.18cm" bisa muncul jauh lebih kecil di PDF daripada label ukurannya (pernah ketemu: label bilang 7.2×5.18cm, tapi yang ke-render cuma ~3.7×2.8cm) — user bisa mengira foto tidak ke-crop dengan benar padahal sebenarnya box PDF-nya yang tidak mengikuti cm.

**Fix wajib dipakai di setiap file yang generate PDF dari foto hasil crop modal ini:** hitung ukuran gambar di PDF dari `entry.widthCm`/`heightCm` (fallback ke `DEFAULT_CROP_W_CM`/`H` kalau foto lama belum punya properti ini), di-cap ke lebar kolom yang tersedia (jaga aspect ratio):
```js
function iePhotoDrawSize(entry, maxW, maxH) {
    var wCm = entry.widthCm || DEFAULT_CROP_W_CM;
    var hCm = entry.heightCm || DEFAULT_CROP_H_CM;
    var w = wCm * 10, h = hCm * 10; // cm -> mm
    if (w > maxW) { h = h * (maxW / w); w = maxW; }
    if (maxH && h > maxH) { w = w * (maxH / h); h = maxH; }
    return { w: w, h: h };
}
```
Lalu di loop `doc.addImage(...)`: panggil `iePhotoDrawSize(imgEntry, colW, maxPhotoH)` per foto (bukan pakai `fw`/`fh` konstan), dan pakai hasil `.w`/`.h` itu utk parameter width/height `addImage` — **karena tiap foto sekarang bisa punya ukuran berbeda, konsekuensinya:**
- Loop grid "2 foto per baris dalam 1 kolom" (before/after masing² bisa 2 foto sejajar) **harus diganti jadi 1 foto per baris** (before & after tetap sejajar kiri-kanan, tapi kalau ada >1 foto per sisi, ditumpuk ke bawah) — supaya lebar-tinggi variabel antar foto tidak bikin foto lain overlap.
- Tinggi baris (`rowH`) dipakai `Math.max(before.h, after.h, minH)` supaya before & after tetap align meski ukurannya beda, dan page-break check (`if (y+rowH+10>ph-marginBottom)`) pakai `rowH` ini per baris (bukan `fh` konstan).
- Estimasi tinggi "blok pertama" (buat cek page-break biar header+subheader+foto pertama gak kepisah halaman) juga harus dihitung dari `iePhotoDrawSize` foto pertama, bukan angka konstan.
- Fitur D (Geser Posisi Gambar / `offsetX`) tetap jalan normal — cuma clamp batasnya (`pw - marginX - fw`) ganti pakai `pw - marginX - dim.w` (lebar foto yg sebenarnya, bukan `fw` konstan lagi).

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

## J. Edit Gambar (Insert Shape: Teks/Panah/Garis/Kotak/Oval)
**Tujuan:** dari dalam Crop Modal, user bisa tap "🖍️ Edit Gambar" untuk membuka editor anotasi ala Insert Shape Word — tambah teks, panah, garis, kotak, oval di atas foto ASLI (sebelum crop). Semua anotasi bisa digeser, di-resize, warna & ketebalan garis bisa dipilih. Editor tampil hampir full-screen dengan zoom (➖/➕) dan tool geser tampilan (✋ pan). Saat selesai, anotasi di-flatten (digabung jadi satu bitmap) ke `#cropImg` lewat `<canvas>`, supaya alur crop selanjutnya tetap normal.

**Trigger dari Crop Modal** (taruh di `.crop-btns` footer crop modal yang sudah ada):
```html
<button class="crop-btn crop-btn-outline" onclick="openImageEditor()">🖍️ Edit Gambar</button>
```

**⚠️ Potensi Konflik:** butuh elemen `#cropImg` & `#cropWrap` dari Fitur B (Crop Modal 3-Mode) sudah ada duluan — `openImageEditor()` membaca `cropImg.src` sebagai sumber, dan `applyImageEdits()` menulis balik hasil flatten ke `cropImg.src` lalu refit ke `cropWrap`. **Kalau file tujuan crop modal-nya beda struktur/id, sesuaikan dulu bagian itu di `openImageEditor()`/`applyImageEdits()`.**

**Catatan gaya kode — SENGAJA beda dari Fitur E:** modul ini pakai **Pointer Events** (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`), bukan `mousedown`+`touchstart` manual. Ini bukan sekadar gaya — sebelumnya pakai pola touch+mouse terpisah dan user melaporkan drag shape (terutama teks & garis) kadang "putus"/tidak jalan di HP Android; setelah diseragamkan ke Pointer Events, masalahnya hilang. **Jangan diganti balik ke pola `mousedown`+`touchstart` untuk fitur ini.**

**Bug penting yang sudah di-fix — soft keyboard nyangkut:** teks dibuat/diedit lewat `window.prompt()` (dialog native). Di Android Chrome, setelah `prompt()` ditutup, soft keyboard sering **tidak ikut turun** karena tidak ada `<input>` asli di halaman yang kehilangan fokus (fokus sebelumnya ada di kotak dialog native, bukan elemen DOM) — dialognya sendiri berfungsi normal (teks berhasil masuk), cuma keyboard-nya nyangkut secara visual dan kadang tap di tempat lain pun tidak menutupnya. **Fix:** panggil `ieForceHideKeyboard()` tepat setelah setiap `prompt()` selesai — fungsi ini fokus-lalu-blur sebuah `<input readonly>` tersembunyi supaya Android mendapat sinyal blur yang nyata dan menutup IME (dibuat readonly saat fokus supaya tidak malah memunculkan keyboard baru). **Pola ini wajib dipakai di mana pun fitur ini pakai `prompt()`** — kalau nanti prompt() diganti custom input di halaman, fix ini tidak diperlukan lagi karena sudah ada `<input>` asli untuk di-blur.

**Bug penting yang sudah di-fix — titik resize (handle) susah dipencet di HP:** `ieHandleR()` sengaja dibuat kecil (~9px) supaya titik hijau terlihat presisi dan tidak menutupi gambar, tapi ini bikin titiknya susah kena jari di layar HP, terutama untuk resize kotak teks. **Fix:** `ieMakeHandle()` sekarang menggambar 2 lingkaran SVG bertumpuk di titik yang sama — lingkaran visual kecil (`pointer-events:none`, cuma buat tampilan) dan lingkaran hit-area transparan yang lebih besar di atasnya (`pointer-events:all`, radius minimal ~22px layar via `ieHandleHitR()`, dikonversi ke koordinat natural gambar sesuai `baseScale × zoom` biar konsisten walau lagi di-zoom). Listener `pointerdown` dipasang di lingkaran hit-area, bukan lingkaran visual. **Jangan pasang listener langsung di lingkaran visual `c`** — itu yang bikin bug ini muncul lagi.

```css
/* ── EDIT GAMBAR (Insert Shape) ── */
.editimg-dialog{width:98vw;height:96vh;max-width:1600px;max-height:1600px;display:flex;flex-direction:column}
#editImgOuter{position:relative;flex:1 1 auto;min-height:0;background:#0c100d;overflow:auto;touch-action:none;display:flex;align-items:center;justify-content:center}
#editImgWrap{position:relative;flex:none;touch-action:none}
#editImg{position:absolute;left:0;top:0;user-select:none;-webkit-user-select:none;pointer-events:none;display:block}
#editSvgOverlay{position:absolute;left:0;top:0;cursor:crosshair;touch-action:none}
.edit-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 14px;background:#1a221e;border-top:1px solid #2a3a30;flex:none}
.edit-tool-btn{width:36px;height:36px;border-radius:7px;border:1px solid #3a4f42;background:#222e26;color:#aac8b5;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.edit-tool-btn.active{background:#2ecc71;color:#0e150f;border-color:#2ecc71}
.edit-tool-btn.zoom-label{width:auto;padding:0 8px;font-size:12px;font-weight:700}
.edit-toolbar-sep{width:1px;align-self:stretch;background:#2a3a30;margin:2px 2px}
.edit-color-swatch{width:24px;height:24px;border-radius:50%;border:2px solid #3a4f42;cursor:pointer;padding:0}
.edit-color-swatch.active{border-color:#fff;box-shadow:0 0 0 2px #2ecc71}
.edit-thick-swatch{width:32px;height:36px;border-radius:7px;border:1px solid #3a4f42;background:#222e26;color:#aac8b5;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.edit-thick-swatch.active{background:#2ecc71;color:#0e150f;border-color:#2ecc71}
```

```html
<!-- ═══ EDIT GAMBAR (Insert Shape: Teks/Panah/Garis/Kotak/Oval) ═══ -->
<div id="editImgModal" class="pdf-preview-modal">
    <div class="crop-dialog editimg-dialog">
        <div class="pdf-preview-header">
            <button type="button" class="pdf-preview-close-x" onclick="closeImageEditor(true)" aria-label="Tutup">✕</button>
            <div class="pdf-preview-title">🖍️ Edit Gambar</div>
            <div class="pdf-preview-hint">Tambah teks/panah/garis/kotak/oval • ✋ geser tampilan • 🔍 zoom</div>
        </div>
        <div id="editImgOuter">
            <div id="editImgWrap">
                <img id="editImg" src="" alt="">
                <svg id="editSvgOverlay" xmlns="http://www.w3.org/2000/svg"></svg>
            </div>
        </div>
        <div class="edit-toolbar" id="editToolbar">
            <button type="button" class="edit-tool-btn active" data-tool="select" onclick="setEditTool('select')" title="Pilih / Pindah">↖</button>
            <button type="button" class="edit-tool-btn" data-tool="text" onclick="setEditTool('text')" title="Tambah Teks">🅰</button>
            <button type="button" class="edit-tool-btn" data-tool="arrow" onclick="setEditTool('arrow')" title="Panah">↗</button>
            <button type="button" class="edit-tool-btn" data-tool="line" onclick="setEditTool('line')" title="Garis">╱</button>
            <button type="button" class="edit-tool-btn" data-tool="rect" onclick="setEditTool('rect')" title="Kotak">▭</button>
            <button type="button" class="edit-tool-btn" data-tool="oval" onclick="setEditTool('oval')" title="Oval">◯</button>
            <button type="button" class="edit-tool-btn" data-tool="pan" onclick="setEditTool('pan')" title="Geser Tampilan">✋</button>
            <span class="edit-toolbar-sep"></span>
            <button type="button" class="edit-color-swatch active" data-color="#e53935" style="background:#e53935" onclick="setEditColor('#e53935',this)" title="Merah"></button>
            <button type="button" class="edit-color-swatch" data-color="#1a1a1a" style="background:#1a1a1a" onclick="setEditColor('#1a1a1a',this)" title="Hitam"></button>
            <button type="button" class="edit-color-swatch" data-color="#1e88e5" style="background:#1e88e5" onclick="setEditColor('#1e88e5',this)" title="Biru"></button>
            <button type="button" class="edit-color-swatch" data-color="#fdd835" style="background:#fdd835" onclick="setEditColor('#fdd835',this)" title="Kuning"></button>
            <span class="edit-toolbar-sep"></span>
            <button type="button" class="edit-thick-swatch" data-thick="S" onclick="setEditThickness('S',this)" title="Garis Tipis">▁</button>
            <button type="button" class="edit-thick-swatch active" data-thick="M" onclick="setEditThickness('M',this)" title="Garis Sedang">▃</button>
            <button type="button" class="edit-thick-swatch" data-thick="L" onclick="setEditThickness('L',this)" title="Garis Tebal">▅</button>
            <button type="button" class="edit-thick-swatch" data-thick="XL" onclick="setEditThickness('XL',this)" title="Garis Sangat Tebal">▇</button>
            <span class="edit-toolbar-sep"></span>
            <button type="button" class="edit-tool-btn" onclick="ieZoomOut()" title="Perkecil Tampilan">➖</button>
            <button type="button" class="edit-tool-btn zoom-label" id="editZoomLabel" onclick="ieZoomReset()" title="Reset Zoom">100%</button>
            <button type="button" class="edit-tool-btn" onclick="ieZoomIn()" title="Perbesar Tampilan">➕</button>
            <span class="edit-toolbar-sep"></span>
            <button type="button" class="edit-tool-btn" id="editTextSmallerBtn" onclick="ieResizeSelectedText(-1)" title="Perkecil Teks" style="display:none">A−</button>
            <button type="button" class="edit-tool-btn" id="editTextBiggerBtn" onclick="ieResizeSelectedText(1)" title="Perbesar Teks" style="display:none">A+</button>
            <button type="button" class="edit-tool-btn" id="editTextEditBtn" onclick="editSelectedText()" title="Edit Teks" style="display:none">✏️</button>
            <button type="button" class="edit-tool-btn" id="editDeleteBtn" onclick="deleteSelectedShape()" title="Hapus" style="display:none">🗑️</button>
        </div>
        <div class="pdf-preview-footer">
            <button class="crop-btn crop-btn-outline" onclick="closeImageEditor(true)">Batal</button>
            <button class="crop-btn crop-btn-save" onclick="applyImageEdits()">✓ Selesai</button>
        </div>
    </div>
        </div>
    </div>
</div>
```

```js
var NS_SVG = 'http://www.w3.org/2000/svg';
var imgEditState = {
    tool: 'select', color: '#e53935', thickness: 'M', zoom: 1, baseScale: 1, shapes: [], selectedId: null,
    naturalW: 0, naturalH: 0, nextId: 1, drawing: null, sourceUrl: null
};
var IE_THICKNESS_FACTORS = { S: 0.0022, M: 0.0045, L: 0.0075, XL: 0.012 };
var IE_ZOOM_MIN = 1, IE_ZOOM_MAX = 4, IE_ZOOM_STEP = 0.5;

function ieMinSize(){ return Math.max(20, imgEditState.naturalW * 0.02); }
function ieHandleR(){ return Math.max(9, imgEditState.naturalW * 0.009); }
function ieStrokeWFor(shape){
    var key = (shape && shape.strokeSize) || imgEditState.thickness || 'M';
    var f = IE_THICKNESS_FACTORS[key] || IE_THICKNESS_FACTORS.M;
    return Math.max(2, imgEditState.naturalW * f);
}
function ieFontDefault(){ return Math.max(18, imgEditState.naturalW * 0.035); }
function ieColorId(c){ return 'ie_' + c.replace('#',''); }
function ieTextBoxSize(shape){
    return { w: Math.max(20, (shape.text.length||1) * shape.fontSize * 0.55), h: shape.fontSize*1.2 };
}

function openImageEditor(){
    var cropImg = document.getElementById('cropImg');
    if (!cropImg || !cropImg.src) { alert('Gambar belum siap untuk diedit.'); return; }
    imgEditState.shapes = []; imgEditState.selectedId = null; imgEditState.nextId = 1;
    imgEditState.tool = 'select'; imgEditState.color = '#e53935'; imgEditState.thickness = 'M'; imgEditState.zoom = 1;
    setEditTool('select');
    var swatches = document.querySelectorAll('.edit-color-swatch');
    swatches.forEach(function(s){ s.classList.toggle('active', s.getAttribute('data-color') === imgEditState.color); });
    var tswatches = document.querySelectorAll('.edit-thick-swatch');
    tswatches.forEach(function(s){ s.classList.toggle('active', s.getAttribute('data-thick') === imgEditState.thickness); });
    ieUpdateZoomLabel();
    var editImg = document.getElementById('editImg');
    editImg.onload = function(){
        imgEditState.naturalW = editImg.naturalWidth;
        imgEditState.naturalH = editImg.naturalHeight;
        fitEditImageToWrap();
        renderAllShapes();
    };
    imgEditState.sourceUrl = cropImg.src;
    editImg.src = cropImg.src;
    document.getElementById('editImgModal').classList.add('show');
}

function fitEditImageToWrap(){
    var outer = document.getElementById('editImgOuter');
    var wrap = document.getElementById('editImgWrap');
    var img = document.getElementById('editImg');
    var svg = document.getElementById('editSvgOverlay');
    var ow = outer.clientWidth, oh = outer.clientHeight;
    var nw = imgEditState.naturalW, nh = imgEditState.naturalH;
    if (!nw || !nh || !ow || !oh) return;
    var baseScale = Math.min(ow/nw, oh/nh);
    imgEditState.baseScale = baseScale;
    var scale = baseScale * (imgEditState.zoom || 1);
    var dw = nw*scale, dh = nh*scale;
    wrap.style.width = dw+'px'; wrap.style.height = dh+'px';
    img.style.width = dw+'px'; img.style.height = dh+'px';
    svg.style.width = dw+'px'; svg.style.height = dh+'px';
    svg.setAttribute('viewBox', '0 0 '+nw+' '+nh);
    outer.style.justifyContent = (dw <= ow + 1) ? 'center' : 'flex-start';
    outer.style.alignItems = (dh <= oh + 1) ? 'center' : 'flex-start';
    if (dw > ow) outer.scrollLeft = Math.max(0, (dw-ow)/2);
    if (dh > oh) outer.scrollTop = Math.max(0, (dh-oh)/2);
}
function ieUpdateZoomLabel(){
    var lbl = document.getElementById('editZoomLabel');
    if (lbl) lbl.textContent = Math.round((imgEditState.zoom||1)*100) + '%';
}
function ieSetZoom(z){
    imgEditState.zoom = Math.max(IE_ZOOM_MIN, Math.min(IE_ZOOM_MAX, z));
    ieUpdateZoomLabel();
    fitEditImageToWrap();
}
function ieZoomIn(){ ieSetZoom((imgEditState.zoom||1) + IE_ZOOM_STEP); }
function ieZoomOut(){ ieSetZoom((imgEditState.zoom||1) - IE_ZOOM_STEP); }
function ieZoomReset(){ ieSetZoom(1); }
window.addEventListener('resize', function(){
    if (document.getElementById('editImgModal').classList.contains('show')) fitEditImageToWrap();
});

function closeImageEditor(discard){
    document.getElementById('editImgModal').classList.remove('show');
    if (discard) { imgEditState.shapes = []; imgEditState.selectedId = null; }
}

function setEditTool(tool){
    imgEditState.tool = tool;
    deselectShape();
    document.querySelectorAll('.edit-tool-btn[data-tool]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-tool') === tool);
    });
    var svg = document.getElementById('editSvgOverlay');
    svg.style.cursor = (tool === 'select') ? 'default' : (tool === 'pan' ? 'grab' : 'crosshair');
}

/* Kembali ke tool 'select' setelah shape baru dibuat, TANPA menghapus seleksi
   shape yang baru saja dibuat (supaya langsung bisa digeser/resize). */
function ieBackToSelectKeepSelection(){
    imgEditState.tool = 'select';
    document.querySelectorAll('.edit-tool-btn[data-tool]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-tool') === 'select');
    });
    var svg = document.getElementById('editSvgOverlay');
    svg.style.cursor = 'default';
}

function setEditColor(color, btnEl){
    imgEditState.color = color;
    document.querySelectorAll('.edit-color-swatch').forEach(function(s){ s.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');
    var sel = getShapeById(imgEditState.selectedId);
    if (sel) { sel.color = color; renderAllShapes(); }
}

function setEditThickness(key, btnEl){
    imgEditState.thickness = key;
    document.querySelectorAll('.edit-thick-swatch').forEach(function(s){ s.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');
    var sel = getShapeById(imgEditState.selectedId);
    if (sel && sel.type !== 'text') { sel.strokeSize = key; renderAllShapes(); }
}

function getShapeById(id){
    for (var i=0;i<imgEditState.shapes.length;i++) if (imgEditState.shapes[i].id === id) return imgEditState.shapes[i];
    return null;
}
function addShape(shape){
    shape.id = imgEditState.nextId++;
    imgEditState.shapes.push(shape);
    setSelectedShape(shape.id);
}
function ieSetSelButtonsDisplay(shape){
    var isText = !!(shape && shape.type === 'text');
    var db = document.getElementById('editDeleteBtn'); if (db) db.style.display = shape ? 'flex' : 'none';
    var tb = document.getElementById('editTextEditBtn'); if (tb) tb.style.display = isText ? 'flex' : 'none';
    var sb = document.getElementById('editTextSmallerBtn'); if (sb) sb.style.display = isText ? 'flex' : 'none';
    var bb = document.getElementById('editTextBiggerBtn'); if (bb) bb.style.display = isText ? 'flex' : 'none';
}
function deselectShape(){
    imgEditState.selectedId = null;
    ieSetSelButtonsDisplay(null);
    renderAllShapes();
}
function setSelectedShape(id){
    imgEditState.selectedId = id;
    var shape = getShapeById(id);
    ieSetSelButtonsDisplay(shape);
    renderAllShapes();
}
function deleteSelectedShape(){
    if (!imgEditState.selectedId) return;
    imgEditState.shapes = imgEditState.shapes.filter(function(s){ return s.id !== imgEditState.selectedId; });
    deselectShape();
}
function editSelectedText(){
    var s = getShapeById(imgEditState.selectedId);
    if (!s || s.type !== 'text') return;
    var val = prompt('Edit teks:', s.text);
    ieForceHideKeyboard();
    if (val !== null && val.trim()) { s.text = val.trim(); renderAllShapes(); }
}
/* Fix: setelah window.prompt() ditutup di Android Chrome, soft keyboard kadang
   "menempel" (tidak ikut turun) karena tidak ada <input> asli di halaman yang
   kehilangan fokus. Trik: fokuskan sebentar lalu blur input tersembunyi supaya
   Android benar-benar mendeteksi ada elemen form yang di-blur dan menutup IME. */
function ieForceHideKeyboard(){
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
        document.activeElement.blur();
    }
    var dummy = document.getElementById('ieKeyboardDismiss');
    if (!dummy) {
        dummy = document.createElement('input');
        dummy.id = 'ieKeyboardDismiss';
        dummy.setAttribute('type', 'text');
        dummy.style.position = 'fixed';
        dummy.style.top = '-1000px';
        dummy.style.left = '0';
        dummy.style.width = '1px';
        dummy.style.height = '1px';
        dummy.style.opacity = '0';
        document.body.appendChild(dummy);
    }
    // readonly saat focus supaya Android TIDAK memunculkan keyboard baru di
    // input dummy ini — cuma dipakai untuk memicu event blur yang sungguhan.
    dummy.setAttribute('readonly', 'readonly');
    dummy.focus();
    setTimeout(function(){ dummy.blur(); dummy.removeAttribute('readonly'); }, 0);
}
function ieResizeSelectedText(dir){
    var s = getShapeById(imgEditState.selectedId);
    if (!s || s.type !== 'text') return;
    var step = Math.max(2, imgEditState.naturalW*0.006);
    s.fontSize = Math.max(10, s.fontSize + dir*step);
    renderAllShapes();
}

function getSvgPoint(evt){
    var svg = document.getElementById('editSvgOverlay');
    var rect = svg.getBoundingClientRect();
    var t = evt.touches ? (evt.touches[0] || evt.changedTouches[0]) : evt;
    var x = (t.clientX - rect.left) * (imgEditState.naturalW / rect.width);
    var y = (t.clientY - rect.top) * (imgEditState.naturalH / rect.height);
    return { x: x, y: y };
}

/* Pakai Pointer Events (bukan touchstart/mousedown terpisah) supaya drag di HP
   (Chrome/Safari Android & iOS) lebih andal — menghindari konflik event
   sentuh vs mouse sintetis yang kadang bikin drag "putus" di tengah jalan. */
function ieAddDocListeners(onMove, onUp){
    document.addEventListener('pointermove', onMove, {passive:false});
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
}
function ieRemoveDocListeners(onMove, onUp){
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
}

/* ── Mulai gambar shape baru (drag dari kosong) ── */
function onEditSvgPointerDown(e){
    var tool = imgEditState.tool;
    if (tool === 'pan') {
        if (e.cancelable) e.preventDefault();
        var outer = document.getElementById('editImgOuter');
        var t0 = e.touches ? e.touches[0] : e;
        var startX = t0.clientX, startY = t0.clientY;
        var startL = outer.scrollLeft, startT = outer.scrollTop;
        var svgEl = document.getElementById('editSvgOverlay'); svgEl.style.cursor = 'grabbing';
        function onMove(mv){
            if (mv.cancelable) mv.preventDefault();
            var t = mv.touches ? mv.touches[0] : mv;
            outer.scrollLeft = startL - (t.clientX - startX);
            outer.scrollTop = startT - (t.clientY - startY);
        }
        function onUp(){ ieRemoveDocListeners(onMove, onUp); svgEl.style.cursor = 'grab'; }
        ieAddDocListeners(onMove, onUp);
        return;
    }
    if (tool === 'select') { if (e.target.id === 'editSvgOverlay') deselectShape(); return; }
    if (e.cancelable) e.preventDefault();
    var pt = getSvgPoint(e);
    if (tool === 'text') {
        var txt = prompt('Masukkan teks:');
        ieForceHideKeyboard();
        if (txt && txt.trim()) addShape({type:'text', x:pt.x, y:pt.y, text:txt.trim(), color:imgEditState.color, fontSize: ieFontDefault()});
        ieBackToSelectKeepSelection();
        return;
    }
    imgEditState.drawing = {type:tool, x1:pt.x, y1:pt.y, x2:pt.x, y2:pt.y, color:imgEditState.color, strokeSize:imgEditState.thickness};
    renderAllShapes();
    function onMove(mv){
        if (mv.cancelable) mv.preventDefault();
        var p = getSvgPoint(mv);
        imgEditState.drawing.x2 = p.x; imgEditState.drawing.y2 = p.y;
        renderAllShapes();
    }
    function onUp(){
        ieRemoveDocListeners(onMove, onUp);
        var d = imgEditState.drawing; imgEditState.drawing = null;
        var dist = Math.hypot(d.x2-d.x1, d.y2-d.y1);
        if (dist > Math.max(8, imgEditState.naturalW*0.008)) {
            if (d.type === 'rect' || d.type === 'oval') {
                addShape({type:d.type, x:Math.min(d.x1,d.x2), y:Math.min(d.y1,d.y2), w:Math.abs(d.x2-d.x1), h:Math.abs(d.y2-d.y1), color:d.color, strokeSize:d.strokeSize});
            } else {
                addShape({type:d.type, x1:d.x1, y1:d.y1, x2:d.x2, y2:d.y2, color:d.color, strokeSize:d.strokeSize});
            }
        } else { renderAllShapes(); }
        ieBackToSelectKeepSelection();
    }
    ieAddDocListeners(onMove, onUp);
}

/* ── Pindahkan shape yang ada (drag body) ── */
function startDragShape(id, ev){
    setSelectedShape(id);
    var shape = getShapeById(id);
    if (!shape) return;
    var startPt = getSvgPoint(ev);
    var orig = JSON.parse(JSON.stringify(shape));
    function onMove(mv){
        if (mv.cancelable) mv.preventDefault();
        var p = getSvgPoint(mv);
        var dx = p.x - startPt.x, dy = p.y - startPt.y;
        if (shape.type === 'line' || shape.type === 'arrow') {
            shape.x1 = orig.x1+dx; shape.y1 = orig.y1+dy; shape.x2 = orig.x2+dx; shape.y2 = orig.y2+dy;
        } else {
            shape.x = orig.x+dx; shape.y = orig.y+dy;
        }
        renderAllShapes();
    }
    function onUp(){ ieRemoveDocListeners(onMove, onUp); }
    ieAddDocListeners(onMove, onUp);
}

/* ── Handle resize/endpoint drag ── */
function startHandleDrag(onDragMove){
    function onMove(mv){ if (mv.cancelable) mv.preventDefault(); onDragMove(getSvgPoint(mv)); renderAllShapes(); }
    function onUp(){ ieRemoveDocListeners(onMove, onUp); }
    ieAddDocListeners(onMove, onUp);
}

/* Radius area sentuh (bukan visual) — minimal setara ~22px layar supaya
   enak dipencet jari, meski titik hijaunya sendiri sengaja dibikin kecil
   biar presisi. Dikonversi ke koordinat "natural" gambar sesuai skala
   tampilan saat ini (baseScale x zoom). */
function ieHandleHitR(){
    var scale = (imgEditState.baseScale || 1) * (imgEditState.zoom || 1);
    var minTouchPx = 22;
    return Math.max(ieHandleR(), minTouchPx / scale);
}
function ieMakeHandle(svg, cx, cy, cursor, onDragMove){
    var r = ieHandleR();
    var c = document.createElementNS(NS_SVG, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', '#2ecc71'); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', Math.max(1, r*0.18));
    c.style.cursor = cursor; c.style.pointerEvents = 'none';
    svg.appendChild(c);
    // Hit-area transparan yang lebih besar, ditumpuk di atas titik visual,
    // supaya gampang dipencet di HP tanpa mengubah ukuran titik yang terlihat.
    var hit = document.createElementNS(NS_SVG, 'circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy); hit.setAttribute('r', ieHandleHitR());
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = cursor; hit.style.pointerEvents = 'all';
    var start = function(ev){ ev.stopPropagation(); if (ev.cancelable) ev.preventDefault(); startHandleDrag(onDragMove); };
    hit.addEventListener('pointerdown', start);
    svg.appendChild(hit);
}

/* ── Bangun 1 elemen visual shape (dipakai utk overlay interaktif & flatten) ── */
function ieBuildShapeVisual(shape){
    var sw = ieStrokeWFor(shape);
    if (shape.type === 'line' || shape.type === 'arrow') {
        var ln = document.createElementNS(NS_SVG, 'line');
        ln.setAttribute('x1', shape.x1); ln.setAttribute('y1', shape.y1);
        ln.setAttribute('x2', shape.x2); ln.setAttribute('y2', shape.y2);
        ln.setAttribute('stroke', shape.color); ln.setAttribute('stroke-width', sw);
        ln.setAttribute('stroke-linecap', 'round');
        if (shape.type === 'arrow') ln.setAttribute('marker-end', 'url(#'+ieColorId(shape.color)+')');
        return ln;
    }
    if (shape.type === 'rect') {
        var rc = document.createElementNS(NS_SVG, 'rect');
        rc.setAttribute('x', shape.x); rc.setAttribute('y', shape.y);
        rc.setAttribute('width', shape.w); rc.setAttribute('height', shape.h);
        rc.setAttribute('stroke', shape.color); rc.setAttribute('stroke-width', sw); rc.setAttribute('fill', 'none');
        return rc;
    }
    if (shape.type === 'oval') {
        var el = document.createElementNS(NS_SVG, 'ellipse');
        el.setAttribute('cx', shape.x+shape.w/2); el.setAttribute('cy', shape.y+shape.h/2);
        el.setAttribute('rx', shape.w/2); el.setAttribute('ry', shape.h/2);
        el.setAttribute('stroke', shape.color); el.setAttribute('stroke-width', sw); el.setAttribute('fill', 'none');
        return el;
    }
    if (shape.type === 'text') {
        var tx = document.createElementNS(NS_SVG, 'text');
        tx.setAttribute('x', shape.x); tx.setAttribute('y', shape.y);
        tx.setAttribute('font-size', shape.fontSize); tx.setAttribute('fill', shape.color);
        tx.setAttribute('font-family', 'Arial, sans-serif'); tx.setAttribute('font-weight', '700');
        tx.setAttribute('dominant-baseline', 'hanging'); tx.setAttribute('stroke', '#fff');
        tx.setAttribute('stroke-width', Math.max(1, shape.fontSize*0.04)); tx.setAttribute('paint-order', 'stroke');
        tx.textContent = shape.text;
        return tx;
    }
    return null;
}

function ieBuildDefs(svg){
    var defs = document.createElementNS(NS_SVG, 'defs');
    ['#e53935','#1a1a1a','#1e88e5','#fdd835'].forEach(function(c){
        var m = document.createElementNS(NS_SVG, 'marker');
        m.setAttribute('id', ieColorId(c)); m.setAttribute('markerWidth', 10); m.setAttribute('markerHeight', 10);
        m.setAttribute('refX', 8); m.setAttribute('refY', 5); m.setAttribute('orient', 'auto'); m.setAttribute('markerUnits', 'userSpaceOnUse');
        var p = document.createElementNS(NS_SVG, 'path');
        p.setAttribute('d', 'M0,0 L10,5 L0,10 Z'); p.setAttribute('fill', c);
        m.appendChild(p); defs.appendChild(m);
    });
    svg.appendChild(defs);
}

/* ── Render ulang seluruh overlay interaktif (shapes + preview + handle seleksi) ── */
function renderAllShapes(){
    var svg = document.getElementById('editSvgOverlay');
    if (!svg) return;
    svg.innerHTML = '';
    ieBuildDefs(svg);
    imgEditState.shapes.forEach(function(shape){
        var g = document.createElementNS(NS_SVG, 'g');
        var visual = ieBuildShapeVisual(shape);
        if (!visual) return;
        g.appendChild(visual);
        // Hit-area lebih lebar supaya mudah disentuh (untuk garis/panah tipis,
        // dan bagian dalam kotak/oval yang defaultnya fill:none tidak bisa disentuh)
        if (shape.type === 'line' || shape.type === 'arrow') {
            var hit = document.createElementNS(NS_SVG, 'line');
            hit.setAttribute('x1', shape.x1); hit.setAttribute('y1', shape.y1);
            hit.setAttribute('x2', shape.x2); hit.setAttribute('y2', shape.y2);
            hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(24, imgEditState.naturalW*0.02));
            g.insertBefore(hit, visual);
        } else if (shape.type === 'rect' || shape.type === 'oval') {
            var fhit = document.createElementNS(NS_SVG, shape.type === 'rect' ? 'rect' : 'ellipse');
            if (shape.type === 'rect') {
                fhit.setAttribute('x', shape.x); fhit.setAttribute('y', shape.y);
                fhit.setAttribute('width', shape.w); fhit.setAttribute('height', shape.h);
            } else {
                fhit.setAttribute('cx', shape.x+shape.w/2); fhit.setAttribute('cy', shape.y+shape.h/2);
                fhit.setAttribute('rx', shape.w/2); fhit.setAttribute('ry', shape.h/2);
            }
            fhit.setAttribute('fill', 'transparent');
            g.insertBefore(fhit, visual);
        } else if (shape.type === 'text') {
            // <text> secara default cuma bisa "diklik" tepat di garis huruf. Tambahkan
            // hit-area kotak penuh (transparan) supaya teks mudah digeser/dipilih di HP.
            var tb = ieTextBoxSize(shape);
            var padX = tb.w*0.08, padY = tb.h*0.15;
            var thit = document.createElementNS(NS_SVG, 'rect');
            thit.setAttribute('x', shape.x - padX); thit.setAttribute('y', shape.y - padY);
            thit.setAttribute('width', tb.w + padX*2); thit.setAttribute('height', tb.h + padY*2);
            thit.setAttribute('fill', 'transparent');
            g.insertBefore(thit, visual);
        }
        g.style.cursor = 'move';
        var start = function(ev){
            if (imgEditState.tool !== 'select') return;
            ev.stopPropagation(); if (ev.cancelable) ev.preventDefault();
            startDragShape(shape.id, ev);
        };
        g.addEventListener('pointerdown', start);
        svg.appendChild(g);

        if (shape.id === imgEditState.selectedId) {
            if (shape.type === 'rect' || shape.type === 'oval') {
                var box = document.createElementNS(NS_SVG, 'rect');
                box.setAttribute('x', shape.x); box.setAttribute('y', shape.y);
                box.setAttribute('width', shape.w); box.setAttribute('height', shape.h);
                box.setAttribute('fill', 'none'); box.setAttribute('stroke', '#2ecc71');
                box.setAttribute('stroke-width', Math.max(1, imgEditState.naturalW*0.0015));
                box.setAttribute('stroke-dasharray', '6,4'); box.setAttribute('pointer-events', 'none');
                svg.appendChild(box);
                ieMakeHandle(svg, shape.x+shape.w, shape.y+shape.h, 'nwse-resize', function(p){
                    shape.w = Math.max(ieMinSize(), p.x-shape.x); shape.h = Math.max(ieMinSize(), p.y-shape.y);
                });
            } else if (shape.type === 'line' || shape.type === 'arrow') {
                ieMakeHandle(svg, shape.x1, shape.y1, 'move', function(p){ shape.x1=p.x; shape.y1=p.y; });
                ieMakeHandle(svg, shape.x2, shape.y2, 'move', function(p){ shape.x2=p.x; shape.y2=p.y; });
            } else if (shape.type === 'text') {
                var tbSel = ieTextBoxSize(shape);
                var box2 = document.createElementNS(NS_SVG, 'rect');
                box2.setAttribute('x', shape.x); box2.setAttribute('y', shape.y);
                box2.setAttribute('width', tbSel.w); box2.setAttribute('height', tbSel.h);
                box2.setAttribute('fill', 'none'); box2.setAttribute('stroke', '#2ecc71');
                box2.setAttribute('stroke-width', Math.max(1, imgEditState.naturalW*0.0015));
                box2.setAttribute('stroke-dasharray', '6,4'); box2.setAttribute('pointer-events', 'none');
                svg.appendChild(box2);
                ieMakeHandle(svg, shape.x+tbSel.w, shape.y+tbSel.h, 'nwse-resize', function(p){
                    var newH = Math.max(10, p.y-shape.y);
                    shape.fontSize = newH/1.2;
                });
            }
        }
    });
    if (imgEditState.drawing) {
        var dvisual = ieBuildShapeVisual(
            (imgEditState.drawing.type==='rect'||imgEditState.drawing.type==='oval')
            ? {type:imgEditState.drawing.type, x:Math.min(imgEditState.drawing.x1,imgEditState.drawing.x2), y:Math.min(imgEditState.drawing.y1,imgEditState.drawing.y2), w:Math.abs(imgEditState.drawing.x2-imgEditState.drawing.x1), h:Math.abs(imgEditState.drawing.y2-imgEditState.drawing.y1), color:imgEditState.drawing.color, strokeSize:imgEditState.drawing.strokeSize}
            : imgEditState.drawing
        );
        if (dvisual) { dvisual.setAttribute('opacity','0.75'); svg.appendChild(dvisual); }
    }
}

(function initEditSvgEvents(){
    var svg = document.getElementById('editSvgOverlay');
    if (!svg) return;
    svg.addEventListener('pointerdown', onEditSvgPointerDown);
})();

/* ── Terapkan semua anotasi: gabung ke gambar asli, kembalikan ke #cropImg ── */
function applyImageEdits(){
    if (!imgEditState.shapes.length) { closeImageEditor(false); return; }
    var nw = imgEditState.naturalW, nh = imgEditState.naturalH;
    var flatSvg = document.createElementNS(NS_SVG, 'svg');
    flatSvg.setAttribute('xmlns', NS_SVG);
    flatSvg.setAttribute('width', nw); flatSvg.setAttribute('height', nh);
    flatSvg.setAttribute('viewBox', '0 0 '+nw+' '+nh);
    ieBuildDefs(flatSvg);
    imgEditState.shapes.forEach(function(shape){
        var v = ieBuildShapeVisual(shape);
        if (v) flatSvg.appendChild(v);
    });
    var svgStr = new XMLSerializer().serializeToString(flatSvg);
    var svgImg = new Image();
    svgImg.onload = function(){
        var canvas = document.createElement('canvas');
        canvas.width = nw; canvas.height = nh;
        var ctx = canvas.getContext('2d');
        var baseImg = document.getElementById('editImg');
        var srcImg = new Image();
        srcImg.onload = function(){
            ctx.drawImage(srcImg, 0, 0, nw, nh);
            ctx.drawImage(svgImg, 0, 0, nw, nh);
            var outUrl = canvas.toDataURL('image/jpeg', 0.92);
            var cropImg = document.getElementById('cropImg');
            cropImg.onload = function(){
                var wrap = document.getElementById('cropWrap');
                var ww = wrap.clientWidth, wh = wrap.clientHeight;
                var scale = Math.min(ww/cropImg.naturalWidth, wh/cropImg.naturalHeight);
                var dw = cropImg.naturalWidth*scale, dh = cropImg.naturalHeight*scale;
                cropImg.style.width = dw+'px'; cropImg.style.height = dh+'px';
                cropImg.style.left = ((ww-dw)/2)+'px'; cropImg.style.top = ((wh-dh)/2)+'px';
                if (cropModalState._mode === 'default') fitCropBoxToFullImage();
                else if (cropModalState._ratioLocked) reshapeCropBoxToRatio();
            };
            cropImg.src = outUrl;
            closeImageEditor(false);
        };
        srcImg.src = imgEditState.sourceUrl;
    };
    svgImg.onerror = function(){ alert('Gagal menerapkan anotasi pada gambar. Coba lagi.'); };
    svgImg.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
}
```

**Integrasi ke alur crop:** tidak perlu ubah apa pun di `cropAndSave()`/`skipCrop()` yang sudah ada — `applyImageEdits()` sudah menulis hasil flatten balik ke `#cropImg` sebelum modal edit ditutup, jadi crop tetap jalan di atas gambar yang sudah dianotasi.

**Butuh dari user:** tidak ada konfigurasi tambahan — modul ini generic (tidak menyentuh struktur data form/tabel).

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
`cropReset`, `cropAndSave`, `skipCrop`, `imgOpenCropper`, `openCropModal`, `closeCropModal`, `setCropMode`, `setCropOrientation`, `renderPresetButtons`, `highlightPreset`, `printReport`, `exportPdf`, `showPdfPreview`, `nudgeImage`, `reEditCrop`, `openImageEditor`, `closeImageEditor`, `applyImageEdits`, `setEditTool`, `setEditColor`, `setEditThickness`, `addShape`, `deleteSelectedShape`, `editSelectedText`, `deselectShape`, `setSelectedShape`, `getShapeById`, `renderAllShapes`, `ieForceHideKeyboard`, `iePhotoDrawSize`.

**Sebelum menempel kode dari dokumen ini, selalu `grep` dulu nama-nama fungsi di atas pada file tujuan.** Kalau sudah ada dan isinya beda, diskusikan dulu ke user mana yang mau dipakai / digabung, jangan main timpa.
