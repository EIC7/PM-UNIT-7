# GitHub Setup Guide - FEGT Module

## 📌 Persiapan

Pastikan Anda sudah memiliki:
- [Git](https://git-scm.com/downloads) terinstall
- [GitHub Account](https://github.com/signup)

## 🔧 Step-by-Step Setup

### Step 1: Buat Repository Baru di GitHub

1. Login ke [github.com](https://github.com)
2. Klik **+ → New repository**
3. Nama repository: `fegt-module`
4. Deskripsi: `FEGT Diagnostics Module - PLTU Paiton Unit 7`
5. Public (agar bisa diakses semua)
6. **Create repository**

### Step 2: Setup Git Lokal

**Jika belum ada folder git**:
```bash
# Buka terminal/command prompt
# Masuk ke folder dimana file FEGT disimpan
cd ~/Downloads/fegt-files

# Inisialisasi git
git init

# Tambahkan remote repository
git remote add origin https://github.com/USERNAME/fegt-module.git

# Ganti USERNAME dengan username GitHub Anda
```

**Jika sudah ada git folder**:
```bash
cd folder-fegt-anda
git remote add origin https://github.com/USERNAME/fegt-module.git
```

### Step 3: Upload File ke GitHub

```bash
# Tambahkan semua file
git add .

# Commit dengan pesan
git commit -m "Add FEGT Module - Initial version"

# Push ke GitHub (branch main)
git branch -M main
git push -u origin main
```

Selesai! File sekarang sudah di GitHub.

### Step 4: Enable GitHub Pages

1. Login ke [github.com](https://github.com)
2. Masuk ke repository `fegt-module`
3. Klik **Settings** (tab kanan atas)
4. Scroll ke **Pages** (sidebar kiri)
5. **Source** → Pilih branch `main`
6. **Save**
7. Tunggu beberapa menit untuk deployment

### Step 5: Akses via Web

Setelah deployment selesai, aplikasi bisa diakses di:

```
https://USERNAME.github.io/fegt-module/fegt.html
```

Contoh:
```
https://john-doe.github.io/fegt-module/fegt.html
```

## 📂 File Structure di GitHub

```
fegt-module/
├── fegt.html              ← Main HTML file
├── fegt-config.js         ← Configuration
├── fegt-shared.js         ← Shared functions
├── fegt-main.js          ← FEGT logic
├── fegt-pdf.js           ← PDF generation
├── README-FEGT.md        ← Documentation
├── GITHUB-SETUP.md       ← This file
└── .gitignore            ← (optional) Exclude files
```

## 🔄 Update Aplikasi

Jika ada perubahan di file:

```bash
# 1. Update file lokal Anda

# 2. Commit perubahan
git add .
git commit -m "Update: [deskripsi perubahan]"

# 3. Push ke GitHub
git push origin main

# GitHub Pages akan auto-update dalam 5-10 menit
```

## 🚨 Troubleshooting

### Error: "fatal: not a git repository"
**Solusi**: Jalankan `git init` di folder yang benar

### Error: "fatal: 'origin' does not appear to be a 'git' repository"
**Solusi**: Update remote dengan URL yang benar
```bash
git remote set-url origin https://github.com/USERNAME/fegt-module.git
```

### GitHub Pages tidak muncul
**Solusi**: 
- Pastikan Settings > Pages > Source sudah set ke `main`
- Tunggu 5-10 menit untuk deployment
- Cek apakah ada error di Actions tab

### URL tidak bisa diakses
**Solusi**:
- Ganti `USERNAME` dengan GitHub username Anda
- Pastikan nama repository benar: `fegt-module`
- Tunggu GitHub Pages deployment selesai

## 📱 Custom Domain (Optional)

Jika ingin menggunakan domain sendiri (mis: fegt.company.com):

1. Settings > Pages
2. Scroll ke **Custom domain**
3. Masukkan domain Anda: `fegt.company.com`
4. Setup DNS records di domain provider Anda

## 🔐 Security Reminder

⚠️ **API Key Supabase ada di Client-Side**

Ini aman karena:
1. Menggunakan Row Level Security (RLS) di Supabase
2. Anonymous access hanya untuk: SELECT pada tabel public
3. Insert/Update/Delete memerlukan authenticated user

Jangan share:
- ❌ Private API Key
- ❌ Database password
- ❌ Credentials apapun

## 📊 Monitor Usage

### View GitHub Actions Logs
1. Repository > Actions tab
2. Lihat deployment logs
3. Cek apakah deployment berhasil

### View Website Analytics (Optional)
Pasang Google Analytics untuk tracking usage:
```html
<!-- Tambahkan di <head> fegt.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## 🤝 Collaboration

Jika tim ingin berkontribusi:

1. **Team Member clone repository**:
```bash
git clone https://github.com/USERNAME/fegt-module.git
cd fegt-module
```

2. **Buat branch untuk fitur baru**:
```bash
git checkout -b feature/new-feature
# Edit files...
git add .
git commit -m "Add: [deskripsi]"
git push origin feature/new-feature
```

3. **Create Pull Request** di GitHub
4. **Review & Merge**

## 📖 Useful Links

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

## ✅ Checklist Sebelum Deploy

- [ ] Semua 5 file sudah di repository
- [ ] README-FEGT.md sudah ada
- [ ] GitHub Pages settings sudah enabled
- [ ] Domain sudah accessible (test via browser)
- [ ] Supabase config sudah benar di fegt-config.js
- [ ] Tested di 3 browser berbeda (Chrome, Firefox, Safari)
- [ ] Mobile responsive tested
- [ ] PDF generation tested

## 🎉 Selesai!

Aplikasi FEGT Anda sekarang live di:
```
https://USERNAME.github.io/fegt-module/fegt.html
```

Share URL ini dengan tim untuk mulai digunakan!

---

**Pertanyaan?** Lihat README-FEGT.md atau buat Issue di GitHub repository.

