/**
 * ==========================================================================
 * OVERLAY LOADING "DOWNLOAD DATA" -- trend/js/loading-overlay.js
 * ==========================================================================
 * Sebelum file ini ada, halaman trend_*.html SAMA SEKALI TIDAK PUNYA
 * indikator loading full-screen saat menarik data historis dari Supabase
 * (baik saat pertama kali dibuka -- app.js memanggil
 * window.UIManager.triggerLoad() otomatis di boot() -- maupun saat user
 * klik tombol LOAD DATA/quick-range). Yang ada cuma teks kecil "MEMUAT..."
 * di tombol (lihat setLoading() di ui-manager.js) -- gampang kelewat kalau
 * fetch-nya lambat (rentang tanggal lebar = banyak baris).
 *
 * Dipasang lewat event yang SUDAH DIKIRIM window.HistoricalManager.loadData()
 * (lihat historical-manager.js): 'dcsHistoricalLoadStart' / 'dcsHistoricalLoadEnd'
 * / 'dcsHistoricalLoadError' -- file ini TIDAK mengubah historical-manager.js
 * ATAU ui-manager.js sama sekali, cuma numpang dengar event yang sudah ada.
 * Overlay dibuat lewat DOM (bukan document.write) dan dibuat sekali secara
 * malas (lazy, baru dibangun saat pertama kali ditampilkan).
 *
 * Desain SENGAJA disamakan satu keluarga visual dengan overlay checksheet
 * (submit/simpan di shared.js -- background solid #060a10 + glow biru
 * pulsar), tapi animasi tengahnya beda arah/makna: cloud/database di atas,
 * 3 lembar "data" JATUH ke bawah ditangkap folder terbuka -- merepresentasikan
 * MENGUNDUH data (bukan mengirim/upload seperti animasi folder-ke-folder di
 * overlay submit). Preview & keputusan desain: lihat riwayat percakapan/
 * artifact "Folder Terbang" (tab "Overlay Trend (Download)").
 *
 * TIDAK menyentuh shared.js -- trend/*.html tidak memuat shared.js sama
 * sekali (arsitektur terpisah, lihat CLAUDE.md), jadi overlay ini
 * benar-benar mandiri (CSS/HTML sendiri, tidak reuse PM_FOLDER_ANIM_CSS).
 * ==========================================================================
 */
(function () {
  'use strict';

  var CSS =
    '@keyframes pmDlGlowPulse{0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}}' +
    '.pm-dl-overlay{position:fixed;inset:0;z-index:2147483000;background:#060a10;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:24px;text-align:center;color:#fff;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}' +
    '.pm-dl-glow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(70vw,320px);height:min(70vw,320px);border-radius:50%;background:radial-gradient(ellipse at center, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0) 70%);filter:blur(2px);animation:pmDlGlowPulse 2.6s ease-in-out infinite;pointer-events:none}' +
    '.pm-dl-scene{position:relative;width:150px;height:170px;z-index:1}' +
    '@keyframes pmDlCloudPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}' +
    '.pm-dl-cloud{position:absolute;left:50%;top:0;transform:translateX(-50%);width:82px;height:40px;animation:pmDlCloudPulse 2.2s ease-in-out infinite}' +
    '.pm-dl-cloud-bump{position:absolute;border-radius:50%;background:linear-gradient(180deg,#7dd3fc,#38bdf8);box-shadow:0 0 14px rgba(56,189,248,.55)}' +
    '.pm-dl-cloud-bump.pm-b1{width:38px;height:38px;left:0;top:2px}' +
    '.pm-dl-cloud-bump.pm-b2{width:30px;height:30px;left:24px;top:-6px}' +
    '.pm-dl-cloud-bump.pm-b3{width:34px;height:34px;right:0;top:4px}' +
    '.pm-dl-cloud-body{position:absolute;left:6px;right:6px;bottom:0;height:20px;border-radius:10px;background:linear-gradient(180deg,#7dd3fc,#38bdf8);box-shadow:0 0 14px rgba(56,189,248,.45)}' +
    '.pm-dl-folder{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:60px;height:42px}' +
    '.pm-dl-folder::before{content:"";position:absolute;top:-7px;left:4px;width:26px;height:9px;background:#c9860f;border-radius:3px 6px 0 0}' +
    '.pm-dl-folder::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#f0b429,#c9860f);border-radius:2px 7px 7px 7px;box-shadow:0 6px 14px rgba(0,0,0,.35)}' +
    '.pm-dl-folder-flap{position:absolute;left:-2px;right:-2px;top:-4px;height:22px;background:linear-gradient(180deg,#ffce54,#e0a52a);border-radius:6px 6px 3px 3px;transform-origin:50% 100%;transform:rotate(0deg) translateY(-2px);box-shadow:0 3px 8px rgba(0,0,0,.3);animation:pmDlFlapCatch 1.5s ease-in-out infinite}' +
    '@keyframes pmDlFlapCatch{0%,34%{transform:rotate(0deg) translateY(-2px)}42%{transform:rotate(-10deg) translateY(-8px)}50%,84%{transform:rotate(0deg) translateY(-2px)}92%{transform:rotate(-10deg) translateY(-8px)}100%{transform:rotate(0deg) translateY(-2px)}}' +
    '.pm-dl-paper{position:absolute;left:50%;top:36px;width:22px;height:16px;margin-left:-11px;background:#f8fafc;border-radius:2px;box-shadow:0 2px 5px rgba(0,0,0,.25);opacity:0;animation:pmDlFall 1.5s cubic-bezier(.4,0,.2,1) infinite}' +
    '.pm-dl-paper::before,.pm-dl-paper::after{content:"";position:absolute;left:3px;right:3px;height:2px;background:#9fb0c3;border-radius:1px}' +
    '.pm-dl-paper::before{top:5px}' +
    '.pm-dl-paper::after{top:9px;right:7px}' +
    '.pm-dl-paper.pm-p2{animation-delay:.5s}' +
    '.pm-dl-paper.pm-p3{animation-delay:1s}' +
    '@keyframes pmDlFall{0%{opacity:0;transform:translate(0,0) scale(.5) rotate(-4deg)}12%{opacity:1;transform:translate(-5px,8px) scale(1) rotate(-3deg)}55%{opacity:1;transform:translate(6px,58px) scale(1.02) rotate(3deg)}85%{opacity:1;transform:translate(-3px,92px) scale(.85) rotate(-3deg)}100%{opacity:0;transform:translate(0,104px) scale(.3) rotate(4deg)}}' +
    '@media (prefers-reduced-motion: reduce){.pm-dl-cloud{animation:none}.pm-dl-folder-flap{animation:none}.pm-dl-paper{animation:none;opacity:.9;transform:translate(0,50px) scale(.9)}.pm-dl-paper.pm-p2{opacity:.5;transform:translate(0,20px) scale(.7)}.pm-dl-paper.pm-p3{opacity:0}}' +
    '.pm-dl-title{color:#fff;font-size:17px;font-weight:800;letter-spacing:.4px}' +
    '.pm-dl-msg{color:#cbd5e1;font-size:13px;max-width:340px;line-height:1.55}';

  var HTML =
    '<div class="pm-dl-glow"></div>' +
    '<div class="pm-dl-scene">' +
      '<div class="pm-dl-cloud">' +
        '<div class="pm-dl-cloud-bump pm-b1"></div>' +
        '<div class="pm-dl-cloud-bump pm-b2"></div>' +
        '<div class="pm-dl-cloud-bump pm-b3"></div>' +
        '<div class="pm-dl-cloud-body"></div>' +
      '</div>' +
      '<div class="pm-dl-paper pm-p1"></div>' +
      '<div class="pm-dl-paper pm-p2"></div>' +
      '<div class="pm-dl-paper pm-p3"></div>' +
      '<div class="pm-dl-folder"><div class="pm-dl-folder-flap"></div></div>' +
    '</div>' +
    '<div class="pm-dl-title">MEMUAT DATA TREND</div>' +
    '<div class="pm-dl-msg">Mengambil data historis dari database, mohon tunggu...</div>';

  var overlayEl = null;
  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    if (!document.getElementById('pmDlOverlayStyle')) {
      var style = document.createElement('style');
      style.id = 'pmDlOverlayStyle';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    overlayEl = document.createElement('div');
    overlayEl.id = 'pmDlOverlay';
    overlayEl.className = 'pm-dl-overlay';
    overlayEl.innerHTML = HTML;
    overlayEl.style.display = 'none';
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  // Delay kecil (150ms) sebelum overlay muncul -- fetch yang kebetulan cepat
  // (rentang waktu pendek/koneksi bagus) tidak perlu memicu overlay
  // berkedip sekilas, cuma bikin UI terasa "flash" tanpa guna.
  var showTimer = null;
  function show() {
    clearTimeout(showTimer);
    showTimer = setTimeout(function () {
      ensureOverlay().style.display = 'flex';
    }, 150);
  }
  function hide() {
    clearTimeout(showTimer);
    if (overlayEl) overlayEl.style.display = 'none';
  }

  window.addEventListener('dcsHistoricalLoadStart', show);
  window.addEventListener('dcsHistoricalLoadEnd', hide);
  window.addEventListener('dcsHistoricalLoadError', hide);
})();
