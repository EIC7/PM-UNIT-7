# 📚 REFERENCE DOCUMENTATION - U7_PM_INSTRUMENT Files

## 📊 File Inventory

### Main Working Files:

| File | Lines | Size | Status | Notes |
|------|-------|------|--------|-------|
| **COMPLETE** | 4183 | 220K | ✅ LATEST | Paling baru & lengkap |
| fix-19.html | 4173 | 219K | ✅ Upload | -63 baris dari COMPLETE |
| fix-26.html | 4110 | 217K | ✅ Used | Basis modular refactor |
| fix-20.html | 4110 | 217K | ✅ | |
| fix-15.html | 4171 | 220K | ✅ | |

**Rekomendasi**: Gunakan **COMPLETE** sebagai source of truth!

---

## 📁 File Structure Map

```
REFERENCE-U7_PM_COMPLETE.html
├── <head> (CSS + Meta + Scripts)
├── <body>
│   ├── pageDashboard        ← Dashboard/Home
│   ├── pageFegt             ← FEGT Diagnostics
│   ├── pageSo2              ← SO2 Scrubber
│   ├── pageOpacity          ← Opacity Monitor
│   ├── pageBeltScale        ← Belt Conveyor
│   └── pageHistory          ← History/Riwayat
│
└── <script> (2700+ baris logic)
    ├── 88 functions
    ├── Global variables (PATHS, SO2_CHECKS, etc)
    ├── Supabase config
    └── Database operations
```

---

## 🔧 Key Components

### **Pages (6 total)**
1. **pageDashboard** - Home/Landing page dengan module cards
2. **pageFegt** - FEGT (Fiber Optic) diagnostics
3. **pageSo2** - SO2 Scrubber monitoring
4. **pageOpacity** - Opacity monitor
5. **pageBeltScale** - Belt conveyor scale
6. **pageHistory** - Historical records

### **Functions (88 total)**
Key functions to know:
- `showPage(name)` - Navigate between pages
- `buildManualTable()` - Build FEGT manual table
- `so2BuildTable()` - Build SO2 table
- `opBuildTable()` - Build Opacity table
- `showBeltScale()` - Show Belt page
- `dbSave()` - Save to Supabase
- `loadHistory()` - Load historical data

### **Global Variables**
```javascript
PATHS           // FEGT paths (9 items)
LEAK_PATHS      // Leak detection paths
SO2_CHECKS      // SO2 maintenance items (57 items)
OPACITY_CHECKS  // Opacity items
SUPA_URL        // Supabase URL
SUPA_KEY        // Supabase API key
SUPA_TABLE      // Table name: 'pm_records'
currentRecordId // Current record ID
```

---

## 💾 Database Schema (Supabase)

### Table: `pm_records`
```sql
id              INTEGER     -- Primary key
modul           TEXT        -- Module name (FEGT, SO2, etc)
tanggal         DATE        -- Record date
pic             TEXT        -- Person in charge
work_order      TEXT        -- Work order reference
unit            TEXT        -- Unit (Unit 7)
data            JSONB       -- Record data (flexible)
created_at      TIMESTAMP   -- Creation time
updated_at      TIMESTAMP   -- Last update
```

---

## 📋 Asset Breakdown

### CSS Elements:
- Layout system (grid, flexbox)
- Color scheme (green theme with RGB codes)
- Form styling (inputs, buttons, selects)
- Table styling
- Modal styling
- Responsive design

### JavaScript Logic:
- Page navigation (showPage)
- Form handling
- Data validation
- File upload (Excel/PDF)
- Database CRUD (Create, Read, Update, Delete)
- PDF report generation
- Clock/timestamp management
- Image cropping/uploading

### HTML Structure:
- Header/navbar (consistent across all pages)
- Form inputs (text, select, date, file, etc)
- Tables (dynamic row generation)
- Modal dialogs
- Footer

---

## 🚀 Deployment History

### Version Timeline:
```
fix-15.html  (2024-06-02)  ← Early version
    ↓
fix-19.html  (2024-06-03)  ← Upload baru, 4173 lines
    ↓
fix-20.html  (2024-06-03)  ← Refined
    ↓
fix-26.html  (2024-06-03)  ← Modular base
    ↓
COMPLETE.html (2024-06-03) ← ⭐ LATEST, 4183 lines
```

---

## 🎯 Known Issues & Fixes Applied

### Issues Resolved:
1. ✅ Duplicate script tags → Fixed by combining into single <script>
2. ✅ Null reference errors → Added safety checks
3. ✅ Missing element handlers → Added conditional checks
4. ✅ Cross-module function conflicts → Created modular versions
5. ✅ Image rendering issues → Fixed with proper base64 handling

### Current Status:
- ✅ All pages functional
- ✅ Database connectivity working
- ✅ Form submission working
- ✅ File upload working
- ✅ PDF generation working
- ✅ No console errors

---

## 📝 Refactoring Status

### Modular Versions Created:
```
u7-pm-modular/                    ← Fetch API based
├── Full app with all pages
├── Separated components
└── Separated pages

u7-pm-app/                        ← Config-based
├── config.js
├── shared.js
├── mod-04-so2.js
└── style.css

Partial Modules:
├── mod-04-so2.html + mod-04-so2.js
├── config.js
├── shared.js
└── style.css
```

---

## 🔄 How to Use COMPLETE as Reference

### For New Development:
1. Use `COMPLETE.html` as the **source of truth**
2. Copy sections when building modular versions
3. Reference function implementations
4. Check page structures
5. Verify database integration patterns

### For Bug Fixes:
1. Compare with `COMPLETE.html`
2. Check if issue exists in original
3. Apply fix to original
4. Propagate to modular versions

### For Feature Additions:
1. Implement in `COMPLETE.html` first
2. Test thoroughly
3. Extract to modular versions
4. Update documentation

---

## 📚 Important Code Snippets

### Supabase Connection:
```javascript
var SUPA_URL   = 'https://ruvvximnnacpvvoogbzs.supabase.co';
var SUPA_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
var SUPA_TABLE = 'pm_records';
```

### Save to Database:
```javascript
function dbSave(modul, tanggal, pic, wo, unit, data, recordId, callback) {
  // Build payload
  var payload = {
    modul: modul,
    tanggal: tanggal,
    pic: pic,
    work_order: wo,
    unit: unit,
    data: data
  };
  
  // POST/PATCH to Supabase
  supaFetch(recordId ? 'PATCH' : 'POST', SUPA_TABLE + (recordId ? '?id=eq.' + recordId : ''), payload)
    .then(result => callback(result[0].id))
    .catch(err => alert('Error: ' + err.message));
}
```

### Navigate Between Pages:
```javascript
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  var page = document.getElementById('page' + name);
  if (page) page.classList.add('active');
  // Additional logic per page
}
```

---

## ✅ Checklist for Next Work

When working with this file:

- [ ] Always check COMPLETE.html first
- [ ] Compare with modular versions for consistency
- [ ] Test all 6 pages before committing
- [ ] Verify Supabase connectivity
- [ ] Check console for errors (F12)
- [ ] Test file upload functionality
- [ ] Test PDF generation
- [ ] Verify responsive design (mobile/tablet)

---

## 🎓 Learning Points

### Architecture:
- Single-page application (SPA)
- Multi-page UI with page div switching
- RESTful API integration (Supabase)
- Form-based data collection
- Document generation (PDF)

### Technologies:
- Vanilla JavaScript (no framework)
- HTML5 + CSS3
- Fetch API (async/await)
- File APIs (upload, read, parse)
- Canvas (image cropping)
- jsPDF (document generation)

### Best Practices Applied:
- Modular code organization
- Function separation
- Global state management
- Error handling
- Responsive design
- Performance optimization

---

**Status**: ✅ COMPLETE.html adalah file yang siap pakai dan paling update!

