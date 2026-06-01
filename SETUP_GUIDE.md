# 🚀 SETUP GUIDE - How to Use v1.2 Locally

**Problem:** Files dari server tidak bisa di-access via `file:///` protocol
**Solution:** Download & setup locally, atau upload ke web server

---

## ✅ OPTION 1: LOCAL SETUP (Recommended for testing)

### Step 1: Download Files
1. Download folder `/mnt/user-data/outputs/`
2. Extract ke folder lokal (misalnya: `C:\PM_System` atau `~/PM_System`)

### Step 2: Folder Structure
```
PM_System/
├── index.html               ← OPEN THIS IN BROWSER
├── belt-scale-e45.html
├── belt-scale-e23.html
├── belt-scale-b12.html
├── opacity.html
├── fegt.html
├── so2.html
├── cems.html                ← NEW: CEMS Calibration
├── history.html
├── assets/
│   ├── config.js
│   ├── shared.js
│   └── style.css
└── (documentation files)
```

### Step 3: Open in Browser
**Option A: Direct File Open**
1. Navigate to `PM_System` folder
2. Double-click `index.html`
3. Browser opens automatically
4. ✅ All links should work!

**Option B: Using Python (Better)**
```bash
# Windows
cd C:\PM_System
python -m http.server 8000

# Mac/Linux
cd ~/PM_System
python3 -m http.server 8000
```
Then open: `http://localhost:8000/index.html`

**Option C: Using Node.js**
```bash
npm install -g http-server
cd PM_System
http-server
```

### Step 4: Configure Supabase
Edit `assets/config.js`:
```javascript
var SUPA_URL = 'your-supabase-url';
var SUPA_KEY = 'your-supabase-api-key';
```

### Step 5: Test
1. Open `index.html`
2. Click "Belt Scale E4/E5"
3. Should open `belt-scale-e45.html` ✅
4. Fill form & upload photos
5. Click "Simpan" → should save to Supabase

---

## 🌐 OPTION 2: WEB SERVER DEPLOYMENT (Production)

### Step 1: Upload Files to Server
Use FTP/SFTP to upload entire `PM_System` folder to web server:
- FTP server: your-server.com
- Path: `/public_html/pm-system/` or `/var/www/html/pm-system/`

### Step 2: Access via URL
Open browser:
```
https://your-domain.com/pm-system/index.html
```

### Step 3: Configure Supabase
Same as local setup - edit `assets/config.js`

### Step 4: Enable HTTPS (Important!)
- Supabase requires HTTPS for production
- Use Let's Encrypt (free SSL certificate)
- Configure in your web server

---

## 🔧 TROUBLESHOOTING

### Problem: "File not found" when clicking links

**Cause:** Files not in same folder, or relative paths wrong

**Solution:**
1. Verify folder structure is correct (all HTML in root, assets in subfolder)
2. Open `index.html` via local server (Python/Node), not double-click
3. Check browser console (F12) for errors

### Problem: "Failed to fetch config.js"

**Cause:** assets/config.js not loading

**Solution:**
1. Verify `assets/` folder exists & contains `config.js`
2. Verify file names match exactly (case-sensitive on Linux!)
3. Try running local server instead of double-click

### Problem: "Supabase connection failed"

**Cause:** Wrong URL or API key

**Solution:**
1. Check `assets/config.js` has correct SUPA_URL
2. Check API key is valid & not expired
3. Check internet connection
4. Open browser console (F12) → Network tab → see what's failing

### Problem: "Can't upload photos"

**Cause:** Missing shared.js or browser issue

**Solution:**
1. Verify `assets/shared.js` exists
2. Try different browser
3. Check browser console for JavaScript errors (F12)

---

## 📱 MOBILE / TABLET ACCESS

### From Same Network (Laptop)
1. Get laptop IP address:
   - Windows: `ipconfig` → look for IPv4
   - Mac/Linux: `ifconfig` → look for inet

2. On tablet/phone, open:
   ```
   http://192.168.x.x:8000/index.html
   ```

### Mobile Responsive
- Works on phones ✅
- Works on tablets ✅
- Tested on Chrome, Firefox, Safari

---

## 🔐 SECURITY NOTES

⚠️ **WARNING:**
- API key visible in `assets/config.js`
- Use public/anon key only (not service key)
- Don't commit to public GitHub

✅ **Best Practice:**
- Use Supabase Row Level Security (RLS)
- Restrict access to authenticated users
- Keep API key private

---

## 📊 MODULES CHECKLIST

After setup, test each module:

- [ ] index.html opens successfully
- [ ] SO2 link works
- [ ] CEMS link works
- [ ] Belt Scale E4/E5 opens
- [ ] Belt Scale E2/E3 opens
- [ ] Belt Scale B1/B2 opens
- [ ] Opacity opens
- [ ] FEGT opens
- [ ] History opens
- [ ] Can fill form & save data
- [ ] Photos upload successfully
- [ ] PDF downloads successfully

---

## 🆘 IF NOTHING WORKS

### Quick Fix (Nuclear Option)
1. Delete all files
2. Re-download from `/mnt/user-data/outputs/`
3. Extract fresh copy
4. Run Python server: `python -m http.server 8000`
5. Open: `http://localhost:8000/index.html`

### Debug Mode
1. Open any HTML file in browser
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for red errors
5. Screenshot & share error messages

---

## ✨ NEW IN THIS VERSION

Added **CEMS Calibration** module:
- Monitor NOx, CO2, O2 analyzers
- Track calibration data
- Export PDF reports
- Save to Supabase

Plus all existing modules:
- Belt Scale (E4/E5, E2/E3, B1/B2) ← with image fix!
- Opacity Monitor
- FEGT Temperature
- SO2 Scrubber
- History Management

---

## 📝 CONFIGURATION CHECKLIST

Before using in production:

- [ ] Downloaded all files
- [ ] Folder structure correct
- [ ] Updated Supabase URL in config.js
- [ ] Updated API key in config.js
- [ ] All links working
- [ ] Photos uploading
- [ ] Data saving to Supabase
- [ ] PDF generating

---

## 🎓 VIDEO WALKTHROUGH (Instructions)

### Opening in Browser:
1. Find `index.html` in PM_System folder
2. Right-click → Open with → Chrome
3. Should see dashboard with 9 modules

### Adding New Record:
1. Click module (e.g., "Belt Scale E4/E5")
2. Fill date, PIC, Work Order
3. Complete inspection checklist
4. Upload photos (drag-drop)
5. Click "Simpan"
6. See success message

### Viewing History:
1. Click "History" on dashboard
2. See all past records
3. Click "Edit" to open record
4. Click "Hapus" to delete

---

## 🚀 NEXT: PRODUCTION DEPLOYMENT

When ready for production:
1. Upload files to web server (cPanel, AWS, DigitalOcean, etc)
2. Configure HTTPS/SSL
3. Update Supabase RLS policies
4. Create backups
5. Share link with team
6. Monitor usage

---

**Status:** ✅ SETUP GUIDE COMPLETE  
**Ready to deploy!**

