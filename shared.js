/* ═══════════════════════════════════════════════════════
   SHARED.JS — Common utilities untuk semua modul PM Unit 7
   ═══════════════════════════════════════════════════════ */

/* ── GATE AKSES (Password + Trusted Device) ──
   HARUS paling atas file supaya halaman ke-block sebelum konten sempat
   kelihatan (mencegah "flash" isi halaman sebelum password diverifikasi).
   document.write() di sini AMAN karena shared.js dipanggil lewat tag script
   dengan atribut src biasa (bukan async/defer) di <head> semua file modul,
   jadi masih di tengah proses parsing dokumen. ── */
(function(){
  document.write(
    '<style id="pmGateHideStyle">html,body{margin:0}body>*:not(#pmAuthGate){display:none !important}</style>' +
    '<div id="pmAuthGate" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:linear-gradient(135deg,#0f2b22,#132e2a);display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">' +
      '<div style="width:100%;max-width:340px;background:#16211c;border:1px solid #23362c;border-radius:14px;padding:26px 22px;box-shadow:0 20px 60px rgba(0,0,0,0.5)">' +
        '<div style="text-align:center;font-size:34px;margin-bottom:6px">&#128274;</div>' +
        '<div style="text-align:center;color:#e6f2ec;font-size:16px;font-weight:700;margin-bottom:4px">Akses Terbatas</div>' +
        '<div style="text-align:center;color:#8fae9d;font-size:12.5px;margin-bottom:18px">Masukkan password untuk membuka halaman ini</div>' +
        '<div id="pmGateNameWrap" style="margin-bottom:10px;display:none">' +
          '<div style="color:#8fae9d;font-size:11px;margin-bottom:6px">Masukkan nama hanya untuk dikenali admin</div>' +
          '<input id="pmGateName" type="text" placeholder="Nama kamu (sekali isi saja)" autocomplete="off" style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:8px;border:1px solid #2b3f34;background:#0f1a15;color:#e6f2ec;font-size:14px;outline:none">' +
        '</div>' +
        '<div style="margin-bottom:10px">' +
          '<input id="pmGatePw" type="password" placeholder="Password" autocomplete="off" style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:8px;border:1px solid #2b3f34;background:#0f1a15;color:#e6f2ec;font-size:14px;outline:none">' +
        '</div>' +
        '<div id="pmGateError" style="color:#ff8686;font-size:12px;min-height:16px;margin-bottom:8px;text-align:center"></div>' +
        '<button id="pmGateSubmit" type="button" style="width:100%;padding:11px;border:none;border-radius:8px;background:#16a085;color:#fff;font-size:14px;font-weight:700;cursor:pointer">Masuk</button>' +
      '</div>' +
    '</div>'
  );
})();

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

/* ── GOOGLE DRIVE PHOTO BACKUP CONFIG ──
   Upload otomatis (silent, non-blocking) setiap foto PM ke Google Drive
   lewat Apps Script Web App, sebagai backup terpisah dari Supabase.
   Ganti GDRIVE_WEB_APP_URL kalau deployment Apps Script diganti/redeploy baru. */
var GDRIVE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxyxAOQaIFkT9EZtTHfkjQeG3TlkLnEu2AKVyhUnguK7Td_zls1qL7IPB_hLsXTaLNBHA/exec';
var GDRIVE_SECRET_TOKEN = 'pmeicunit7-mahfud';

function uploadFotoKeGDrive(dataUrlBase64, fileName, modul, keterangan) {
  if (!GDRIVE_WEB_APP_URL || !dataUrlBase64 || !fileName) return;
  fetch(GDRIVE_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      token: GDRIVE_SECRET_TOKEN,
      imageBase64: dataUrlBase64,
      fileName: fileName,
      modul: modul || (window.CURRENT_MODUL || 'unknown'),
      keterangan: keterangan || ''
    })
  }).then(function(res){ return res.json(); })
    .then(function(result){
      if (!result.success) console.error('Upload GDrive gagal:', result.error);
    })
    .catch(function(err){ console.error('Upload GDrive error:', err); });
}

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

/* ── SUPA FETCH DENGAN AUTO-RETRY (khusus GET) ──
   Dipakai buat request yang aman diulang (idempotent, contoh: cek status
   gate, ambil password hash) supaya gangguan sesaat (timeout/522 pas
   Supabase lagi sibuk) tidak langsung gagal dan memaksa user refresh
   manual berkali-kali -- yang justru menambah beban request baru ke
   database yang lagi struggling. JANGAN dipakai untuk POST/PATCH/DELETE,
   karena retry pada request yang mengubah data bisa bikin data duplikat
   kalau request pertama sebenarnya sudah berhasil tapi responsnya hilang. */
function supaFetchRetry(path, retries, delayMs) {
  retries = (typeof retries === 'number') ? retries : 2;
  delayMs = (typeof delayMs === 'number') ? delayMs : 1200;
  return supaFetch('GET', path).catch(function(err) {
    if (retries <= 0) throw err;
    return new Promise(function(resolve) { setTimeout(resolve, delayMs); })
      .then(function() { return supaFetchRetry(path, retries - 1, delayMs * 2); });
  });
}

/* ── UKURAN BYTE (UTF-8) DARI STRING ──
   Dipakai buat ngukur ukuran payload JSON yang beneran mau dikirim, supaya
   nanti pas dbLoad progress-nya bisa dihitung dari ukuran ASLI (bukan
   estimasi), meski respons Supabase gzip/chunked dan lengthComputable
   selalu false. */
function _dbByteLength(str) {
  if (window.TextEncoder) return new TextEncoder().encode(str).length;
  return unescape(encodeURIComponent(str)).length; // fallback browser lama
}

/* ── SUPA FETCH DENGAN PROGRESS (XMLHttpRequest) ──
   fetch() tidak punya event progress bawaan utk upload (kirim data), jadi
   dipakai XHR khusus di sini supaya dbSave (upload) & dbLoad (download) bisa
   nampilin progress asli 0-100% berdasarkan ukuran data beneran, bukan
   animasi kira-kira. onProgress(percent, phase) dipanggil berkali-kali
   selama transfer; phase = 'upload' atau 'download'.

   expectedTotal (opsional) = ukuran byte ASLI (uncompressed) dari payload
   yang sudah kita tahu duluan (disimpan sebagai kolom payload_size waktu
   dbSave). Kalau diisi, progress download dihitung manual dari e.loaded
   (jumlah byte yang sudah diterima -- ini SELALU ada di event progress,
   walau lengthComputable false) dibagi expectedTotal, karena Supabase GET
   selalu dikirim gzip/chunked sehingga lengthComputable bawaan browser
   tidak pernah true. Dibatasi maksimal 97% selama transfer (baru dipaksa
   100% pas xhr.onload) sebab byte yang lewat jaringan = ukuran ter-gzip,
   biasanya LEBIH KECIL dari expectedTotal (ukuran JSON asli sebelum
   dikompres), jadi kalau tidak dibatasi progress bisa "mentok" duluan
   sebelum respons beneran selesai diterima. */
function supaFetchProgress(method, path, body, onProgress, expectedTotal) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, SUPA_URL + '/rest/v1/' + path, true);
    xhr.setRequestHeader('apikey', SUPA_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPA_KEY);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Prefer', 'return=representation');
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = function(e) {
        // Dibatasi maks 95% -- begitu semua byte selesai terkirim, e.loaded/e.total
        // sudah 100% padahal Supabase masih proses INSERT/UPDATE + nyiapin respons
        // di baliknya. Kalau gak dibatasi, progress keliatan "selesai" (100%) padahal
        // masih proses beneran. Baru dianggap benar-benar kelar begitu xhr.onload
        // kepanggil (lihat .then di dbSave -> overlay langsung ditutup).
        if (e.lengthComputable) onProgress(Math.min(95, Math.round((e.loaded / e.total) * 100)), 'upload');
      };
    }
    if (onProgress) {
      xhr.onprogress = function(e) {
        if (expectedTotal) {
          var p = Math.min(97, Math.round((e.loaded / expectedTotal) * 100));
          onProgress(p, 'download');
        } else if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100), 'download');
        }
      };
    }
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100, 'download'); // paksa 100% begitu respons full diterima
        var text = xhr.responseText;
        try { resolve(text ? JSON.parse(text) : []); }
        catch (e) { resolve([]); }
      } else {
        reject(new Error(xhr.responseText || ('HTTP ' + xhr.status)));
      }
    };
    xhr.onerror = function() { reject(new Error('Network error')); };
    xhr.send(body ? JSON.stringify(body) : null);
  });
}

/* ── GATE AKSES: LOGIC (device id, cek password, sinkron trusted device) ──
   Tabel Supabase yang dibutuhkan (jalankan sekali di SQL editor Supabase):
     create table trusted_devices (
       device_id text primary key,
       device_name text,
       user_agent text,
       first_seen timestamptz default now(),
       last_seen timestamptz default now(),
       trusted boolean default false,
       access_revoked boolean default false
     );
     alter table trusted_devices disable row level security;

     create table gate_config (
       id int primary key default 1,
       password_hash text not null,
       updated_at timestamptz default now()
     );
     insert into gate_config (id, password_hash) values (1, '<hash password awal>');
     alter table gate_config disable row level security;

   Password TIDAK lagi disimpan di file ini (sengaja, biar tidak kebaca lewat
   View Source) — ganti password sekarang lewat form di device-admin.html,
   yang meng-update baris di tabel gate_config. ── */
var PM_GATE_TABLE = 'trusted_devices';
var PM_GATE_CONFIG_TABLE = 'gate_config';
var PM_GATE_CHECK_INTERVAL = 10 * 60 * 1000; // 10 menit -- lihat pmCheckAccessRemote

function pmSimpleHash(str) {
  // Hash sederhana (BUKAN cryptographic-grade) — cukup supaya password tidak
  // kebaca polos. Ini bukan proteksi keamanan tinggi, tapi cukup untuk
  // penghalang praktis (lihat penjelasan di chat).
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function pmLS(op, key, val) {
  try {
    if (op === 'get') return localStorage.getItem(key);
    if (op === 'set') { localStorage.setItem(key, val); return true; }
    if (op === 'remove') { localStorage.removeItem(key); return true; }
  } catch (e) {}
  return null;
}

function pmGetDeviceId() {
  var id = pmLS('get', 'pm_device_id');
  if (!id) {
    id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    pmLS('set', 'pm_device_id', id);
  }
  return id;
}

function pmUnlockGate() {
  var style = document.getElementById('pmGateHideStyle');
  var gate = document.getElementById('pmAuthGate');
  if (style && style.parentNode) style.parentNode.removeChild(style);
  if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
}

function pmShowGateError(msg) {
  var el = document.getElementById('pmGateError');
  if (el) el.textContent = msg;
}

function pmFetchCurrentPwHash() {
  // Ambil hash password yang BERLAKU SEKARANG langsung dari Supabase (live,
  // bukan dari cache) — dipakai saat validasi submit password di gate supaya
  // password baru yang baru diganti admin langsung berlaku, tanpa perlu
  // device lain sempat "sinkron" duluan.
  return supaFetchRetry(PM_GATE_CONFIG_TABLE + '?id=eq.1&select=password_hash&limit=1')
    .then(function(rows) {
      return (rows && rows.length) ? rows[0].password_hash : null;
    });
}

function pmSyncDeviceToSupabase(deviceId, name) {
  var ua = navigator.userAgent || '';
  var now = new Date().toISOString();
  supaFetch('GET', PM_GATE_TABLE + '?device_id=eq.' + encodeURIComponent(deviceId) + '&limit=1')
    .then(function(rows) {
      if (rows && rows.length) {
        var patch = { last_seen: now, user_agent: ua };
        if (name) patch.device_name = name;
        return supaFetch('PATCH', PM_GATE_TABLE + '?device_id=eq.' + encodeURIComponent(deviceId), patch);
      }
      return supaFetch('POST', PM_GATE_TABLE, {
        device_id: deviceId, device_name: name || '', user_agent: ua,
        first_seen: now, last_seen: now, trusted: false
      });
    })
    .then(function(){
      // Baru ditandai "sudah tercatat" kalau BENERAN berhasil sampai ke
      // Supabase — supaya kalau gagal (mis. tabel belum dibuat saat itu),
      // percobaan berikutnya (pmInitGate di kunjungan lain) otomatis coba
      // kirim ulang, bukan dianggap selesai padahal belum pernah nyampe.
      pmLS('set', 'pm_device_synced', '1');
    })
    .catch(function(err){ console.error('Gate sync error (akan dicoba lagi nanti):', err); });
}

function pmCheckAccessRemote(deviceId) {
  // Cek status terbaru ke Supabase (background, tidak nge-block UI konten
  // yang lagi dibuka, tapi menentukan status buat kunjungan berikutnya):
  // - trusted=true            -> lolos otomatis, cache lokal disimpan.
  // - row device dihapus admin-> dianggap "device di-reset total": cache
  //                              password & trusted lokal dihapus, jadi
  //                              kunjungan berikutnya wajib password lagi.
  // - access_revoked=true     -> admin sengaja klik "Cabut Trusted": cache
  //                              password lokal ikut dihapus juga.
  // - password_hash berubah   -> admin ganti password lewat device-admin ->
  //                              cache password lokal yang lama dihapus,
  //                              device (yang belum Trusted) wajib password
  //                              baru di kunjungan berikutnya.
  //
  // DIBATASI ke maksimal sekali per PM_GATE_CHECK_INTERVAL: dulu fungsi ini
  // jalan di SETIAP page load (dan ada ±20 halaman di app ini), jadi kalau
  // user pindah-pindah halaman atau refresh berkali-kali pas koneksi
  // lagi bermasalah, request numpuk cepat dan makin membebani database
  // yang lagi struggling. Sekarang cukup dicek ulang tiap beberapa menit.
  var now = Date.now();
  var lastCheck = parseInt(pmLS('get', 'pm_gate_last_check') || '0', 10);
  if (now - lastCheck < PM_GATE_CHECK_INTERVAL) return;
  pmLS('set', 'pm_gate_last_check', String(now));

  supaFetchRetry(PM_GATE_TABLE + '?device_id=eq.' + encodeURIComponent(deviceId) + '&select=trusted,access_revoked&limit=1')
    .then(function(rows) {
      if (!rows || !rows.length) {
        pmLS('remove', 'pm_trusted_flag');
        pmLS('remove', 'pm_auth_pw_hash');
        pmLS('remove', 'pm_device_synced');
        return;
      }
      var row = rows[0];
      if (row.trusted === true) { pmLS('set', 'pm_trusted_flag', '1'); pmUnlockGate(); return; }
      pmLS('remove', 'pm_trusted_flag');
      if (row.access_revoked === true) { pmLS('remove', 'pm_auth_pw_hash'); return; }
      // Bukan trusted & bukan revoked -> cek juga apakah password globalnya
      // sudah diganti admin sejak device ini terakhir login.
      pmFetchCurrentPwHash().then(function(currentHash) {
        var localHash = pmLS('get', 'pm_auth_pw_hash');
        if (currentHash && localHash && localHash !== currentHash) {
          pmLS('remove', 'pm_auth_pw_hash');
        }
      });
    })
    .catch(function(){
      // Gagal walau sudah di-retry -> jangan block UI, biarin cache lokal
      // yang lama tetap berlaku. Reset lastCheck supaya kunjungan berikutnya
      // (bukan cuma refresh detik ini juga) boleh coba lagi lebih cepat.
      pmLS('set', 'pm_gate_last_check', '0');
    });
}

function pmInitGate() {
  var deviceId = pmGetDeviceId();
  var storedName = pmLS('get', 'pm_device_name') || '';
  var alreadyTrustedLocally = pmLS('get', 'pm_trusted_flag') === '1';
  var localPwHash = pmLS('get', 'pm_auth_pw_hash');
  var alreadySynced = pmLS('get', 'pm_device_synced') === '1';

  // Selalu cek ulang ke Supabase di background (nangkep kasus baru
  // ditandai/dicabut Trusted, password diganti admin, atau device pindah
  // browser/clear cache). Tidak nge-block tampilan halaman yang sedang
  // dibuka — cuma menentukan status untuk load berikutnya.
  pmCheckAccessRemote(deviceId);

  if (alreadyTrustedLocally || localPwHash) {
    // Catatan: device dengan localPwHash tersimpan dianggap lolos dulu
    // (instan, tanpa nunggu network) — kalau ternyata password sudah
    // diganti admin, pmCheckAccessRemote() di atas akan menghapus cache-nya
    // di background, jadi baru kunjungan BERIKUTNYA yang bakal diminta
    // password baru. Ini trade-off wajar untuk sistem tanpa server auth.
    pmUnlockGate();
    if (!alreadySynced) pmSyncDeviceToSupabase(deviceId, storedName);
    return;
  }

  var nameWrap = document.getElementById('pmGateNameWrap');
  var nameInput = document.getElementById('pmGateName');
  var pwInput = document.getElementById('pmGatePw');
  var submitBtn = document.getElementById('pmGateSubmit');
  if (!storedName && nameWrap) nameWrap.style.display = 'block';

  function setSubmitBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Memeriksa...' : 'Masuk';
  }

  function submit() {
    var pw = ((pwInput && pwInput.value) || '').trim();
    if (!pw) { pmShowGateError('Password wajib diisi.'); return; }
    var name = storedName;
    if (!storedName) {
      name = ((nameInput && nameInput.value) || '').trim();
      if (!name) { pmShowGateError('Nama wajib diisi (sekali saja).'); return; }
    }
    pmShowGateError('');
    setSubmitBusy(true);
    pmFetchCurrentPwHash().then(function(currentHash) {
      setSubmitBusy(false);
      if (!currentHash) {
        pmShowGateError('Tidak bisa menghubungi server, coba lagi.');
        return;
      }
      if (pmSimpleHash(pw) !== currentHash) {
        pmShowGateError('Password salah, coba lagi.');
        if (pwInput) { pwInput.value = ''; pwInput.focus(); }
        return;
      }
      if (!storedName) pmLS('set', 'pm_device_name', name);
      pmLS('set', 'pm_auth_pw_hash', currentHash);
      pmSyncDeviceToSupabase(deviceId, name);
      pmUnlockGate();
    }).catch(function() {
      setSubmitBusy(false);
      pmShowGateError('Gagal menghubungi server, coba lagi.');
    });
  }

  if (submitBtn) submitBtn.addEventListener('click', submit);
  if (pwInput) pwInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
  if (nameInput) nameInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
  if (nameWrap && nameWrap.style.display === 'block' && nameInput) nameInput.focus();
  else if (pwInput) pwInput.focus();
}

// Elemen gate sudah pasti ada di DOM di titik ini (ditulis via document.write
// sinkron di atas, dalam satu eksekusi <script> yang sama), jadi aman
// dipanggil langsung tanpa nunggu DOMContentLoaded.
pmInitGate();

/* ── TOAST NOTIFICATION ── */
function dbShowToast(msg) {
  var t = document.getElementById('dbToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'dbToast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#16a085;color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.3s;white-space:nowrap;max-width:90vw;text-align:center';
    // Hide toast during print (pages define @media print .no-print{display:none})
    try { t.classList.add('no-print'); } catch(e){}
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(function(){ t.style.opacity='0'; }, 3000);
}

/* ── DB LOAD (satu record by ID) ── */
function dbLoad(id, callback) {
  dbShowSavingOverlay(true, 'Memuat data, mohon tunggu...', 'Data dengan banyak gambar membutuhkan waktu yang lama');
  // Step 1: query ringan buat ambil payload_size (ukuran asli data) duluan,
  // supaya progress bar di step 2 bisa dihitung dari ukuran ASLI -- bukan
  // simulasi -- walau Supabase GET selalu gzip/chunked (lengthComputable browser
  // gak pernah true). Kalau record lama belum punya payload_size (null),
  // otomatis fallback ke simulasi asymptotic seperti biasa.
  supaFetch('GET', SUPA_TABLE + '?id=eq.' + id + '&select=payload_size&limit=1')
    .then(function(sizeRows) {
      var expectedSize = (sizeRows && sizeRows[0] && sizeRows[0].payload_size) ? sizeRows[0].payload_size : null;
      return supaFetchProgress('GET', SUPA_TABLE + '?id=eq.' + id + '&limit=1', null, function(percent, phase) {
        if (phase === 'download') dbReportRealProgress(percent);
      }, expectedSize);
    })
    .then(function(rows) {
      if (rows && rows[0]) { dbShowSavingOverlay(false); callback(rows[0]); }
      else dbShowSavingOverlayError('Data tidak ditemukan.', 'Kemungkinan data sudah dihapus atau ID tidak valid.');
    })
    .catch(function(err){ dbShowSavingOverlayError('Gagal memuat data.', err.message || String(err)); });
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

/* ── SAVING OVERLAY (full-screen, blocks double-submit) ── */
function dbShowSavingOverlay(show, msg, submsg) {
  var ov = document.getElementById('dbSavingOverlay');
  if (show) {
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'dbSavingOverlay';
      ov.style.cssText = 'position:fixed;inset:0;background:#060a10;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;transition:background-color 0.2s;overflow:hidden';
      ov.innerHTML = '<div id="dbSavingGlowField" style="position:absolute;width:min(92vw,440px);height:min(92vw,440px);border-radius:50%;background:radial-gradient(ellipse at center, rgba(66,220,255,0.16) 0%, rgba(66,220,255,0) 70%);filter:blur(2px);animation:dbEicFieldPulse 2.6s ease-in-out infinite;pointer-events:none;z-index:0"></div>'
        + '<div id="dbSavingSpinner" style="width:min(96vw,560px);height:min(96vw,560px);position:relative;margin-bottom:10px;z-index:1">'
        +   '<svg id="dbSavingRingSvg" viewBox="0 0 320 320" style="width:100%;height:100%;display:block;overflow:visible">'
        +     '<defs><path id="dbBoltShape" d="M14 0 L2 20 L11 20 L8 40 L23 16 L13 16 Z"/></defs>'
        +     '<circle cx="160" cy="160" r="128" fill="none" stroke="#3ad4ff" stroke-width="1.5" stroke-dasharray="3 9" opacity="0.5" style="filter:drop-shadow(0 0 5px #35c9ff);transform-origin:160px 160px;animation:dbEicRingSpin 10s linear infinite"/>'
        +     '<circle cx="160" cy="160" r="112" fill="none" stroke="#3ad4ff" stroke-width="2.5" style="filter:drop-shadow(0 0 5px #35c9ff) drop-shadow(0 0 14px #0aa8ff);animation:dbEicRingPulse 2s ease-in-out infinite"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(268.2,189.0) rotate(105) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:0s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(216.0,257.0) rotate(150) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:0.2s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(131.0,268.2) rotate(195) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:0.4s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(63.0,216.0) rotate(240) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:0.6s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(51.8,131.0) rotate(285) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:0.8s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(104.0,63.0) rotate(330) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:1s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(189.0,51.8) rotate(15) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:1.2s"/>'
        +     '<use href="#dbBoltShape" fill="#cdf9ff" transform="translate(257.0,104.0) rotate(60) scale(1.3) translate(-11.5,-20)" style="filter:drop-shadow(0 0 4px #9fefff) drop-shadow(0 0 10px #35c9ff);animation:dbEicBoltPulse 1.6s ease-in-out infinite;animation-delay:1.4s"/>'
        +   '</svg>'
        +   '<div id="dbSavingEicWrap" style="position:absolute;left:50%;top:32%;transform:translate(-50%,-50%);display:flex;font-family:\'Arial Black\',Impact,-apple-system,sans-serif;font-weight:900;font-size:clamp(24px,7.5vw,32px);letter-spacing:2px;color:#eaffff">'
        +     '<span style="display:inline-block;animation:dbEicFlicker 2.4s infinite;animation-delay:0s;text-shadow:0 0 6px #7fe9ff,0 0 14px #35c9ff,0 0 24px #0aa8ff">E</span>'
        +     '<span style="display:inline-block;animation:dbEicFlicker 2.4s infinite;animation-delay:0.15s;text-shadow:0 0 6px #7fe9ff,0 0 14px #35c9ff,0 0 24px #0aa8ff">I</span>'
        +     '<span style="display:inline-block;animation:dbEicFlicker 2.4s infinite;animation-delay:0.3s;text-shadow:0 0 6px #7fe9ff,0 0 14px #35c9ff,0 0 24px #0aa8ff">C</span>'
        +     '<span style="display:inline-block;animation:dbEicFlicker 2.4s infinite;animation-delay:0.45s;text-shadow:0 0 6px #7fe9ff,0 0 14px #35c9ff,0 0 24px #0aa8ff">7</span>'
        +   '</div>'
        +   '<div id="dbSavingErrorIcon" style="display:none;position:absolute;left:50%;top:32%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:#e74c3c;color:#fff;font-size:26px;font-weight:700;align-items:center;justify-content:center;line-height:1">&#10005;</div>'
        +   '<div id="dbSavingMsgGroup" style="position:absolute;left:50%;top:63%;transform:translate(-50%,-50%);width:62%;max-width:320px;text-align:center">'
        +     '<div id="dbSavingOverlayMsg" style="font-size:clamp(11px,3.4vw,14px);font-weight:600;line-height:1.35"></div>'
        +     '<div id="dbSavingProgressWrap" style="width:100%;max-width:180px;height:6px;background:rgba(255,255,255,0.2);border-radius:5px;margin:10px auto 0;overflow:hidden;display:none">'
        +       '<div id="dbSavingProgressBar" style="height:100%;width:0%;background:#2ecc71;border-radius:5px;transition:width 0.12s linear"></div>'
        +     '</div>'
        +     '<div id="dbSavingProgressPct" style="font-size:12px;font-weight:700;color:#fff;margin-top:5px;display:none"></div>'
        +     '<div id="dbSavingOverlaySub" style="font-size:clamp(9px,2.8vw,11px);font-weight:400;margin-top:8px;color:rgba(255,255,255,0.75);line-height:1.3"></div>'
        +   '</div>'
        + '</div>'
        + '<div id="dbSavingOverlayTapHint" style="display:none;font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);margin-top:14px;letter-spacing:0.3px;z-index:1">Tap dimana saja untuk menutup</div>';
      document.body.appendChild(ov);
      // Tap-to-close HANYA berfungsi kalau overlay lagi dalam mode error
      // (ov._isError === true) -- supaya overlay TIDAK bisa ke-tap-tutup
      // sengaja/gak-sengaja pas proses simpan/muat masih benar-benar berjalan.
      ov.addEventListener('click', function() {
        if (ov._isError) dbShowSavingOverlay(false);
      });
      if (!document.getElementById('dbSpinKeyframes')) {
        var style = document.createElement('style');
        style.id = 'dbSpinKeyframes';
        style.textContent = '@keyframes dbSpin{to{transform:rotate(360deg)}}'
          + '@keyframes dbEicRingSpin{to{transform:rotate(360deg)}}'
          + '@keyframes dbEicRingPulse{0%,100%{stroke-opacity:0.55}50%{stroke-opacity:1}}'
          + '@keyframes dbEicBoltPulse{0%,100%{opacity:0.6}50%{opacity:1}}'
          + '@keyframes dbEicFlicker{0%,92%,100%{opacity:1}93%{opacity:0.35}95%{opacity:1}96%{opacity:0.5}98%{opacity:1}}'
          + '@keyframes dbEicFieldPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}';
        document.head.appendChild(style);
      }
    }
    document.getElementById('dbSavingOverlayMsg').textContent = msg || 'Menyimpan data, mohon tunggu...';
    document.getElementById('dbSavingOverlaySub').textContent = submsg || '';
    // Pastikan overlay balik ke mode NORMAL (spinner) setiap kali dipanggil
    // buat proses baru -- jaga-jaga kalau sebelumnya sempat ditinggal dalam
    // mode error (mestinya sudah ditutup manual, tapi ini pengaman tambahan).
    ov._isError = false;
    ov.style.cursor = 'default';
    ov.style.backgroundColor = '#060a10';
    document.getElementById('dbSavingRingSvg').style.display = 'block';
    document.getElementById('dbSavingEicWrap').style.display = 'flex';
    document.getElementById('dbSavingErrorIcon').style.display = 'none';
    document.getElementById('dbSavingOverlayTapHint').style.display = 'none';
    ov.style.display = 'flex';
    dbStartFakeProgress(); // langsung tampil & jalan 0% -> ~90%, di-override begitu ada progress asli
  } else if (ov) {
    ov.style.display = 'none';
    ov._isError = false;
    dbStopFakeProgress();
    dbSetSavingProgress(null);
  }
}

/* ── OVERLAY MODE ERROR ──
   Dipanggil sebagai pengganti dbShowSavingOverlay(false) + alert() di titik
   .catch() proses simpan/muat data. BEDA dari alert(): overlay ini TETAP
   NEMPEL di layar sampai user sendiri yang tap untuk menutup -- alasannya,
   kalau user kebetulan lagi AFK / HP diletak pas errornya kejadian, alert()
   gampang kelewat/ke-skip (apalagi di HP: alert() browser bisa otomatis
   ke-dismiss kalau tab pindah fokus/HP dikunci). Overlay full-screen begini
   jauh lebih susah kelewat karena nutupin seluruh layar terus sampai dibuka. */
function dbShowSavingOverlayError(msg, submsg) {
  var ov = document.getElementById('dbSavingOverlay');
  if (!ov) { alert(msg || 'Terjadi kesalahan.'); return; } // safety net kalau overlay belum sempat dibuat
  dbStopFakeProgress();
  dbSetSavingProgress(null);
  ov._isError = true;
  ov.style.cursor = 'pointer';
  ov.style.backgroundColor = '#1a0505'; // semburat merah gelap solid, beda dari overlay normal
  document.getElementById('dbSavingRingSvg').style.display = 'none';
  document.getElementById('dbSavingEicWrap').style.display = 'none';
  document.getElementById('dbSavingErrorIcon').style.display = 'flex';
  document.getElementById('dbSavingOverlayMsg').textContent = msg || 'Terjadi kesalahan, proses tidak selesai.';
  document.getElementById('dbSavingOverlaySub').textContent = submsg || '';
  document.getElementById('dbSavingOverlayTapHint').style.display = 'block';
  ov.style.display = 'flex';
}

/* ── PROGRESS SIMULASI (fallback) ──
   Banyak respons Supabase/PostgREST (terutama GET/download) tidak mengirim
   header Content-Length (chunked transfer), sehingga e.lengthComputable
   selalu false dan event progress ASLI tidak pernah terpanggil. Supaya
   garis loading tidak diam/kosong, kita jalankan simulasi 0% -> ~90% yang
   melambat (asymptotic). Begitu progress ASLI datang (dbReportRealProgress),
   simulasi langsung berhenti dan angka asli yang dipakai. */
var _dbFakeProgressTimer = null;
var _dbFakeProgressVal = 0;
var _dbRealProgressSeen = false;
var _dbLastShownPercent = 0; // dipakai supaya progress gak pernah keliatan mundur/reset (lihat dbSetSavingProgress)

function dbStartFakeProgress() {
  _dbFakeProgressVal = 0;
  _dbRealProgressSeen = false;
  _dbLastShownPercent = 0;
  dbSetSavingProgress(0);
  clearInterval(_dbFakeProgressTimer);
  _dbFakeProgressTimer = setInterval(function () {
    if (_dbRealProgressSeen) { clearInterval(_dbFakeProgressTimer); return; }
    _dbFakeProgressVal += (90 - _dbFakeProgressVal) * 0.08 + 0.4;
    if (_dbFakeProgressVal > 90) _dbFakeProgressVal = 90;
    dbSetSavingProgress(_dbFakeProgressVal);
  }, 180);
}

function dbStopFakeProgress() {
  clearInterval(_dbFakeProgressTimer);
  _dbFakeProgressTimer = null;
}

/* Dipanggil dari callback onProgress supaFetchProgress ketika ada progress ASLI
   (lengthComputable true, atau expectedTotal sudah diketahui duluan). Menghentikan
   simulasi & memakai angka sebenarnya. */
function dbReportRealProgress(percent) {
  _dbRealProgressSeen = true;
  dbSetSavingProgress(percent);
}

/* ── SET PROGRESS 0-100% di overlay ──
   percent = null/undefined -> sembunyikan garis progress (dipakai saat overlay ditutup,
   ini juga me-reset _dbLastShownPercent supaya overlay berikutnya mulai dari 0 lagi).
   Progress SENGAJA dibikin gak pernah mundur (selalu ambil nilai terbesar antara yang
   lama & yang baru) -- soalnya kalau simulasi sempat jalan duluan lalu progress ASLI
   datang mulai dari angka lebih kecil, angkanya bakal keliatan "loncat balik ke 0%
   terus naik lagi", yang kesannya kayak loading dua kali padahal cuma satu proses. */
function dbSetSavingProgress(percent) {
  var wrap = document.getElementById('dbSavingProgressWrap');
  var bar  = document.getElementById('dbSavingProgressBar');
  var pct  = document.getElementById('dbSavingProgressPct');
  if (!wrap || !bar || !pct) return;
  if (percent === null || percent === undefined || isNaN(percent)) {
    wrap.style.display = 'none';
    pct.style.display = 'none';
    _dbLastShownPercent = 0;
    return;
  }
  var p = Math.max(0, Math.min(100, Math.round(percent)));
  if (p < _dbLastShownPercent) p = _dbLastShownPercent; // jangan pernah mundur
  _dbLastShownPercent = p;
  wrap.style.display = 'block';
  pct.style.display = 'block';
  bar.style.width = p + '%';
  pct.textContent = p + '%';
}

/* ── DB SAVE (generic — modul-specific dbCollectData defined per page) ── */
function dbSave(modul, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
  if (window._dbSaving) return; // cegah klik dobel saat masih proses simpan
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
  // Hitung ukuran byte ASLI (uncompressed) dari payload sebelum dikirim, dan
  // simpan sebagai payload_size di record itu sendiri. Nanti dbLoad baca
  // angka ini duluan supaya progress bar loading bisa dihitung dari ukuran
  // data yang SEBENARNYA, bukan simulasi kira-kira.
  rec.payload_size = _dbByteLength(JSON.stringify(rec));
  var btn = null;
  try { btn = event && event.target && event.target.tagName === 'BUTTON' ? event.target : null; } catch(e){}
  var origText = btn ? btn.innerHTML : '';
  window._dbSaving = true;
  if (btn) { btn.innerHTML = '⏳ Menyimpan...'; btn.disabled = true; }
  dbShowSavingOverlay(true, existingId ? 'Memperbarui data, mohon tunggu...' : 'Menyimpan data, mohon tunggu...', 'Mengupload banyak gambar membutuhkan waktu yang lama');
  var path, method;
  if (existingId) {
    path  = SUPA_TABLE + '?id=eq.' + existingId;
    method = 'PATCH';
  } else {
    path  = SUPA_TABLE;
    method = 'POST';
  }
  supaFetchProgress(method, path, rec, function(percent, phase) {
    if (phase === 'upload') dbReportRealProgress(percent);
  })
    .then(function(rows) {
      window._dbSaving = false;
      dbShowSavingOverlay(false);
      if (btn) { btn.innerHTML = origText; btn.disabled = false; }
      var savedId = (rows && rows[0] && rows[0].id) ? rows[0].id : existingId;
      // PENTING: tetap "nempel" ke record yang sama (bukan di-null-kan) supaya
      // klik Simpan berikutnya tetap UPDATE record ini, bukan bikin duplikat baru.
      // _editingId hanya boleh direset ke null lewat tombol Reset/mulai entri baru.
      window._editingId = savedId || null;
      if (typeof autosaveClear === 'function') autosaveClear();
      dbShowToast(existingId ? '✓ Data berhasil diperbarui!' : '✓ Data berhasil disimpan!');
      if (callback) callback(savedId);
    })
    .catch(function(err) {
      window._dbSaving = false;
      if (btn) { btn.innerHTML = origText; btn.disabled = false; }
      // Sengaja TIDAK pakai dbShowToast di sini -- toast otomatis hilang
      // dalam 3 detik, jadi kalau user lagi AFK/HP diletak pas errornya
      // kejadian, notifikasinya kelewat dan data yang gagal simpan
      // (kadang sudah termasuk banyak foto) jadi tidak ketahuan.
      dbShowSavingOverlayError('Gagal menyimpan data.', err.message || String(err));
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
  if (n.indexOf('O2')>=0) return 'O2';
  if (n.indexOf('OPACITY')>=0) return 'OPACITY';
  if (n.indexOf('CEMS')>=0) return 'CEMS_CALIBRATION';
  if (n.indexOf('BELT')>=0 || n.indexOf('CONVEYOR')>=0) {
    if (n.indexOf('E4')>=0 || n.indexOf('E45')>=0 || (n.indexOf('E-4')>=0)) return 'BELT_E45';
    if (n.indexOf('E2')>=0 || n.indexOf('E23')>=0 || (n.indexOf('E-2')>=0)) return 'BELT_E23';
    if (n.indexOf('B1')>=0 || n.indexOf('B12')>=0 || (n.indexOf('B-1')>=0)) return 'BELT_B12';
    return 'BELT';
  }
  if (n.indexOf('MAINTENANCE')>=0 || n.indexOf('REPORT')>=0) return 'MAINTENANCE_REPORT';
  if (n.indexOf('SILO')>=0) return 'COAL_SILO_LEVEL';
  if (n.indexOf('COAL')>=0 || n.indexOf('FEEDER')>=0) return 'COAL_FEEDER';
  if (n.indexOf('DCS')>=0 || n.indexOf('HMI')>=0 || n.indexOf('OIS')>=0) return 'DCS_HMI';
  if (n.indexOf('FLOW METER')>=0 || n.indexOf('FLOWMETER')>=0 || n.indexOf('FGD')>=0) return 'FLOWMETER_FGD';
  if (n.indexOf('CONDUCTIVITY')>=0) return 'CONDUCTIVITY';
  if (n.indexOf('HG')>=0 || n.indexOf('MERCURY')>=0) return 'PM_HG_ANALYZER';
  if (n.indexOf('PH')>=0 || n.indexOf('TRANSMITTER')>=0 || n.indexOf('AIT')>=0 || n.indexOf('ANALYZER')>=0) return 'PH-ANALYZER';
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
    input.setAttribute('capture', 'environment');
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
    alert('Gagal membaca file: ' + file.name + '\n\nKemungkinan sebab:\n\u2022 Foto masih tersimpan di cloud (Google Photos / Samsung Cloud) dan belum terunduh penuh ke HP \u2014 buka foto itu di aplikasi Galeri sampai termuat penuh, lalu coba upload lagi.\n\u2022 File terlalu besar atau format tidak didukung.\n\nJika masih gagal, coba screenshot foto tersebut lalu upload screenshot-nya.');
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
  var existing = (p.replaceIdx >= 0 && p.imgArr[p.replaceIdx]) ? p.imgArr[p.replaceIdx] : null;
  if (existing) caption = existing.caption || '';
  imgCompressAndStore(canvas, p.name, p.imgArr, p.side, p.modulePrefix, null, caption, existing ? p.replaceIdx : -1);
}

function skipCrop() {
  var modal = document.getElementById('cropModal');
  var p = modal._pending;
  modal.style.display = 'none';
  var caption = '';
  var existing = (p.replaceIdx >= 0 && p.imgArr[p.replaceIdx]) ? p.imgArr[p.replaceIdx] : null;
  if (existing) caption = existing.caption || '';
  var img2 = new Image();
  img2.onload = function(){
    var c = document.createElement('canvas');
    c.width = img2.naturalWidth; c.height = img2.naturalHeight;
    c.getContext('2d').drawImage(img2,0,0);
    imgCompressAndStore(c, p.name, p.imgArr, p.side, p.modulePrefix, null, caption, existing ? p.replaceIdx : -1);
  };
  img2.onerror = function(){ imgCompressAndStore(null, p.name, p.imgArr, p.side, p.modulePrefix, p.dataUrl, caption, existing ? p.replaceIdx : -1); };
  img2.src = p.dataUrl;
}

function imgCompressAndStore(canvas, name, imgArr, side, modulePrefix, rawDataUrl, caption, replaceIdx) {
  var MAX_TOTAL = 1 * 1024 * 1024;
  // Cap resolusi maksimal SEBELUM kompresi kualitas dimulai. Foto kamera HP modern
  // biasanya 3000-4000px+ di sisi terpanjang, padahal di PDF foto ini paling besar
  // dicetak ~18cm lebar (lihat iePhotoDrawSize / maxPhotoW di tiap modul) -- di
  // 300dpi (kualitas cetak bagus) itu cuma butuh ~2126px. 1920px dipilih sebagai
  // batas aman (masih di atas kebutuhan cetak manapun di sistem ini) supaya TIDAK
  // ADA PENURUNAN KUALITAS YANG KELIHATAN, tapi total piksel (dan makanya ukuran
  // file) bisa turun drastis dibanding resolusi asli kamera. Ini dilakukan DULU,
  // baru sisa logika kompresi kualitas (0.85->0.25) jalan di atas kanvas yang
  // sudah dikecilkan -- jadi jarang perlu turun kualitas jauh sama sekali, karena
  // resolusi sudah masuk akal duluan.
  var MAX_DIMENSION = 1920;
  if (canvas && (canvas.width > MAX_DIMENSION || canvas.height > MAX_DIMENSION)) {
    var capFactor = MAX_DIMENSION / Math.max(canvas.width, canvas.height);
    var capped = document.createElement('canvas');
    capped.width = Math.max(1, Math.round(canvas.width * capFactor));
    capped.height = Math.max(1, Math.round(canvas.height * capFactor));
    capped.getContext('2d').drawImage(canvas, 0, 0, capped.width, capped.height);
    canvas = capped;
  }
  var quality = 0.85, dataUrl;
  if (!canvas && rawDataUrl) { dataUrl = rawDataUrl; }
  else if (!canvas) { return; }
  if (canvas) {
    for (var q = quality; q >= 0.25; q -= 0.1) {
      dataUrl = canvas.toDataURL('image/jpeg', q);
      var currentTotal = imgArr.reduce(function(acc,im,i){return acc+((replaceIdx>=0 && i===replaceIdx) ? 0 : (im.dataUrl?im.dataUrl.length*0.75:0));},0);
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
  var entry = {name: name.replace(/\.[^.]+$/, '.jpg'), dataUrl: dataUrl, type: 'image/jpeg', caption: caption||''};
  // Foto yang di-edit ulang (replaceIdx>=0) ditaruh KEMBALI di posisi yang sama,
  // bukan dihapus lalu ditambahkan di akhir array — supaya urutan galeri (dan
  // keterangan yang mengikuti indexnya saat render) tidak berubah/tertukar.
  if (replaceIdx >= 0 && imgArr[replaceIdx]) imgArr.splice(replaceIdx, 1, entry);
  else imgArr.push(entry);
  uploadFotoKeGDrive(dataUrl, name, modulePrefix, caption);
  if (modulePrefix === 'op') { opRenderPreviews(side); updateSizeIndicator('op', side); }
  else if (modulePrefix === 'bs') { bsRenderPreviews(side); updateSizeIndicator('bs', side); }
  else if (modulePrefix === 'cf') { cfRenderPreviews(); updateSizeIndicator('cf', null); }
  else if (modulePrefix === 'ph') {
    if (typeof phRenderPreviews === 'function') phRenderPreviews(side);
    if (typeof phUpdateSizeInfo === 'function') phUpdateSizeInfo(side);
  }
  else if (modulePrefix === 'dcs') {
    if (typeof dcsRenderPreviews === 'function') dcsRenderPreviews(side);
  }
  else if (modulePrefix === 'cl') {
    if (typeof clRenderPreviews === 'function') clRenderPreviews(side);
  }
  else if (modulePrefix === 'ld') {
    if (typeof ldRenderPreviews === 'function') ldRenderPreviews(side);
  }
  else if (modulePrefix === 'fm') {
    if (typeof fmRenderPreviews === 'function') fmRenderPreviews(side);
  }
  else if (modulePrefix === 'hg') {
    if (typeof hgRenderPreviews === 'function') hgRenderPreviews(side);
  }
  else if (modulePrefix === 'cs') {
    if (typeof csRenderPreviews === 'function') csRenderPreviews(side);
    if (typeof csUpdateSizeInfo === 'function') csUpdateSizeInfo(side);
  }
}

function updateSizeIndicator(prefix, side) {
  var arr;
  if (prefix === 'op') arr = opImages[side];
  else if (prefix === 'bs') arr = bsImages[side];
  else if (prefix === 'cf') arr = (typeof cfImages !== 'undefined') ? cfImages : [];
  else arr = [];
  if (!arr) arr = [];
  var total = arr.reduce(function(acc,im){return acc+(im.dataUrl?im.dataUrl.length*0.75:0);},0);
  var kb = (total/1024).toFixed(0);
  var color = total > 900*1024 ? '#e74c3c' : total > 700*1024 ? '#f39c12' : 'var(--text3)';
  var el = prefix === 'cf'
    ? document.getElementById('cfSizeInfo')
    : document.getElementById(prefix+'SizeInfo'+side);
  if(el){ el.textContent = kb+' KB / 1024 KB'; el.style.color = color; }
}

/* ═══════════════════════════════════════════════════════
   AUTOSAVE DRAFT (IndexedDB) — jaga-jaga halaman tertutup
   tidak sengaja sebelum sempat klik Simpan.

   Cara pakai di tiap file modul (HTML):
   1. Di awal <script>, definisikan nama modul:
        window.CURRENT_MODUL = 'fegt';   // sesuaikan per modul
   2. Sediakan fungsi restoreDraftData(rec, editingId) yang mengisi
      ulang field form dari objek rec (struktur sama persis dengan
      return value dbCollectData(modul)). Lihat contoh di fegt.html.
   Modul yang BELUM punya restoreDraftData() otomatis dilewati
   (autosave tetap jalan di background, hanya prompt "lanjutkan draft"
   yang tidak akan muncul).
   ═══════════════════════════════════════════════════════ */
var AUTOSAVE_DB_NAME = 'pm_unit7_autosave';
var AUTOSAVE_STORE   = 'drafts';
var AUTOSAVE_DELAY   = 2500; // ms, debounce setelah berhenti mengetik/upload
var _autosaveTimer = null;
var _autosaveDbPromise = null;

function _autosaveOpenDb() {
  if (_autosaveDbPromise) return _autosaveDbPromise;
  _autosaveDbPromise = new Promise(function(resolve, reject) {
    if (!window.indexedDB) { reject(new Error('IndexedDB tidak didukung browser ini')); return; }
    var req = indexedDB.open(AUTOSAVE_DB_NAME, 1);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(AUTOSAVE_STORE)) db.createObjectStore(AUTOSAVE_STORE, {keyPath:'key'});
    };
    req.onsuccess = function(e){ resolve(e.target.result); };
    req.onerror = function(e){ reject(e.target.error); };
  });
  return _autosaveDbPromise;
}
function autosaveSet(key, value) {
  return _autosaveOpenDb().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction(AUTOSAVE_STORE, 'readwrite');
      tx.objectStore(AUTOSAVE_STORE).put({key:key, value:value, savedAt:Date.now()});
      tx.oncomplete = function(){ resolve(); };
      tx.onerror = function(e){ reject(e.target.error); };
    });
  });
}
function autosaveGet(key) {
  return _autosaveOpenDb().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction(AUTOSAVE_STORE, 'readonly');
      var req = tx.objectStore(AUTOSAVE_STORE).get(key);
      req.onsuccess = function(){ resolve(req.result || null); };
      req.onerror = function(e){ reject(e.target.error); };
    });
  });
}
function autosaveDelete(key) {
  return _autosaveOpenDb().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction(AUTOSAVE_STORE, 'readwrite');
      tx.objectStore(AUTOSAVE_STORE).delete(key);
      tx.oncomplete = function(){ resolve(); };
      tx.onerror = function(e){ reject(e.target.error); };
    });
  });
}
function _autosaveKey() {
  var modul = window.CURRENT_MODUL || location.pathname.split('/').pop().replace(/\.html$/,'') || 'unknown';
  return 'draft_' + modul;
}
function _autosaveIndicator() {
  var el = document.getElementById('autosaveIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'autosaveIndicator';
    el.className = 'no-print';
    el.style.cssText = 'position:fixed;bottom:14px;right:14px;background:rgba(0,0,0,0.65);color:#cfe3f7;font-size:11px;padding:5px 11px;border-radius:14px;z-index:99998;pointer-events:none;opacity:0;transition:opacity .35s';
    document.body.appendChild(el);
  }
  el.textContent = '💾 Draft tersimpan otomatis';
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.style.opacity='0'; }, 1800);
}
function autosaveTrigger() {
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(function(){
    try {
      if (typeof dbCollectData !== 'function') return;
      var modul = window.CURRENT_MODUL || undefined;
      var rec = modul ? dbCollectData(modul) : dbCollectData();
      if (!rec) return;
      autosaveSet(_autosaveKey(), {rec: rec, editingId: window._editingId || null})
        .then(_autosaveIndicator).catch(function(){});
    } catch(e) {}
  }, AUTOSAVE_DELAY);
}
function autosaveClear() {
  autosaveDelete(_autosaveKey()).catch(function(){});
}
function autosaveCheckAndPrompt() {
  // Jangan tawarkan draft kalau memang sedang buka record dari RIWAYAT (?id=...)
  var params = new URLSearchParams(window.location.search);
  if (params.get('id')) return;
  if (typeof restoreDraftData !== 'function') return; // modul ini belum siap restore draft
  autosaveGet(_autosaveKey()).then(function(row){
    if (!row || !row.value || !row.value.rec) return;
    var savedAt = row.value.savedAt ? new Date(row.value.savedAt) : null;
    var timeStr = savedAt ? savedAt.toLocaleString('id-ID') : '';
    var msg = 'Ditemukan draft yang belum sempat disimpan' + (timeStr ? ' (terakhir diubah ' + timeStr + ')' : '') + '.\n\nLanjutkan mengisi draft ini?';
    if (confirm(msg)) {
      restoreDraftData(row.value.rec, row.value.editingId);
    } else {
      autosaveDelete(_autosaveKey()).catch(function(){});
    }
  }).catch(function(){});
}
// Trigger autosave saat ada perubahan input apa pun di halaman (event delegation)
document.addEventListener('input', autosaveTrigger, true);
document.addEventListener('change', autosaveTrigger, true);
// Simpan segera saat halaman mau ditutup/di-minimize (jaga-jaga sebelum sempat debounce)
document.addEventListener('visibilitychange', function(){
  if (document.visibilityState === 'hidden') {
    clearTimeout(_autosaveTimer);
    try {
      if (typeof dbCollectData !== 'function') return;
      var modul = window.CURRENT_MODUL || undefined;
      var rec = modul ? dbCollectData(modul) : dbCollectData();
      if (rec) autosaveSet(_autosaveKey(), {rec: rec, editingId: window._editingId || null});
    } catch(e) {}
  }
});
// Cek draft begitu halaman selesai load
if (document.readyState === 'complete') {
  setTimeout(autosaveCheckAndPrompt, 300);
} else {
  window.addEventListener('load', function(){ setTimeout(autosaveCheckAndPrompt, 300); });
}
