# FEGT Module - Dokumentasi & Setup Guide

## 📋 Daftar File

Modul FEGT terdiri dari **5 file utama**:

| File | Fungsi | Ukuran |
|------|--------|--------|
| **fegt.html** | File utama (HTML + CSS) | ~50 KB |
| **fegt-config.js** | Global variables & Supabase config | ~2 KB |
| **fegt-shared.js** | Helper functions & Database CRUD | ~4 KB |
| **fegt-main.js** | FEGT-specific functions | ~25 KB |
| **fegt-pdf.js** | PDF generation logic | ~20 KB |

## 🚀 Cara Menggunakan

### 1. **Download Semua File**
```
Downloads/
├── fegt.html
├── fegt-config.js
├── fegt-shared.js
├── fegt-main.js
└── fegt-pdf.js
```

### 2. **Jalankan dengan HTTP Server**
Karena menggunakan AJAX (Fetch API), file harus dijalankan via HTTP, bukan file:// protocol.

**Option A: Python 3**
```bash
cd Downloads
python -m http.server 8000
# Buka browser: http://localhost:8000/fegt.html
```

**Option B: Node.js (http-server)**
```bash
npm install -g http-server
cd Downloads
http-server
# Buka browser: http://localhost:8080/fegt.html
```

**Option C: Python 2**
```bash
cd Downloads
python -m SimpleHTTPServer 8000
# Buka browser: http://localhost:8000/fegt.html
```

### 3. **Upload ke GitHub Pages**
```bash
# 1. Buat repository baru (fegt-module)
# 2. Masukkan semua file ke folder root atau docs/
# 3. Push ke GitHub
# 4. Aktifkan GitHub Pages (Settings > Pages > Source: main/docs)
# 5. Akses via: https://username.github.io/fegt-module/fegt.html
```

### 4. **Deploy ke Web Server**
```bash
# Upload semua file ke folder publik di server Anda
# Pastikan menggunakan HTTPS untuk Supabase
```

## ⚙️ Konfigurasi

### Supabase Connection (fegt-config.js)
```javascript
var SUPA_URL   = 'https://ruvvximnnacpvvoogbzs.supabase.co';
var SUPA_KEY   = 'eyJhbGci...'; // API Key
var SUPA_TABLE = 'pm_records';
```

Jika mengubah database:
1. Buka `fegt-config.js`
2. Update `SUPA_URL`, `SUPA_KEY`, `SUPA_TABLE`
3. Pastikan tabel di database memiliki kolom: `id`, `modul`, `tanggal`, `pic`, `work_order`, `unit`, `data`

## 📝 Fitur-Fitur

### 1. **Input Data Excel** 
- Upload file Excel dengan format: Path, Tx, Rx, Reading Temp, Status
- Auto-detect kolom (jika sesuai naming convention)
- Manual column mapping (jika tidak terdeteksi)

### 2. **Input Manual**
- Isi data per path secara manual
- 21 paths untuk FEGT
- 9 paths untuk Leak Detection

### 3. **Diagnosis**
- Analisis sensor berdasarkan path data
- Status: OK / Warning / Hard Fail
- Visualisasi path topology

### 4. **Leak Detection**
- 9 paths untuk deteksi kebocoran
- Status: OK / Fail / Hard Fail / N/A

### 5. **PDF Report**
- Generate laporan professional
- Include sensor diagnosis & leak detection results
- Signature section untuk operator

### 6. **Database Save**
- Simpan hasil ke Supabase
- Update atau create record baru
- Track history

## 🔧 Troubleshooting

### Error: "CORS Policy" atau "No 'Access-Control-Allow-Origin'"
**Penyebab**: File dijalankan via `file://` protocol
**Solusi**: Gunakan HTTP server (lihat Cara Menggunakan #2)

### Error: "Supabase connection failed"
**Penyebab**: URL/Key tidak benar atau Supabase offline
**Solusi**: 
- Cek `SUPA_URL` dan `SUPA_KEY` di `fegt-config.js`
- Pastikan koneksi internet aktif
- Periksa Supabase dashboard

### Error: "File read failed"
**Penyebab**: Browser tidak support File API
**Solusi**: Gunakan browser modern (Chrome, Firefox, Edge, Safari)

### Excel tidak terdeteksi format
**Penyebab**: Format tidak sesuai atau sheet kosong
**Solusi**: 
- Pastikan ada header row
- Gunakan format .xlsx (bukan .xls)
- Gunakan manual column mapping

## 📊 Database Schema

```sql
-- Table: pm_records
CREATE TABLE pm_records (
  id SERIAL PRIMARY KEY,
  modul TEXT,                    -- 'FEGT', 'SO2', 'OPACITY', 'BELT...'
  tanggal DATE,                  -- Tanggal input
  pic TEXT,                      -- Person In Charge
  work_order TEXT,               -- Referensi work order
  unit TEXT,                     -- 'Unit 7'
  data JSONB,                    -- {paths: [...], checks: {...}, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Data Flow

```
fegt.html (UI)
     ↓
fegt-config.js (Variables)
fegt-shared.js (Utilities)
fegt-main.js (FEGT Logic)
fegt-pdf.js (PDF Generation)
     ↓
   Supabase API
     ↓
   Database
```

## 📱 Responsive Design

- ✅ Desktop (1200+ px)
- ✅ Tablet (768-1199 px)
- ✅ Mobile (< 768 px)

## 🔐 Security Notes

1. **API Key**: `SUPA_KEY` ada di client-side (bukan rahasia)
   - Gunakan Row Level Security (RLS) di Supabase untuk proteksi
   
2. **Data Validation**: Semua input di-validate sebelum submit

3. **HTTPS**: Wajib gunakan HTTPS jika production

## 📞 Support

Jika ada masalah:
1. Cek console browser (F12 > Console tab)
2. Lihat error message di aplikasi
3. Cek troubleshooting section di atas

## 📄 License

Project ini adalah bagian dari sistem monitoring PLTU Paiton Unit 7.
© PT POMI 2024

---

**Status**: ✅ READY FOR DEPLOYMENT

