/* ═══════════════════════════════════════════════════════════
   FEGT MODULE - CONFIGURATION FILE
   ═══════════════════════════════════════════════════════════ */

// ── SUPABASE CONFIGURATION
var SUPA_URL   = 'https://ruvvximnnacpvvoogbzs.supabase.co';
var SUPA_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE1NDAsImV4cCI6MjA5NDYxNzU0MH0.GRu5n0Jl2fP0V8L_QLN2Tkmd0Aw0JbMRu25I7t-R7l8';
var SUPA_TABLE = 'pm_records';

// ── FEGT PATHS (21 paths)
var PATHS = [
  {id:1,tx:6,rx:1},{id:2,tx:7,rx:3},{id:3,tx:8,rx:5},
  {id:4,tx:5,rx:2},{id:5,tx:8,rx:4},{id:6,tx:3,rx:6},
  {id:7,tx:5,rx:7},{id:8,tx:3,rx:8},{id:9,tx:7,rx:5},
  {id:10,tx:4,rx:3},{id:11,tx:6,rx:5},{id:12,tx:8,rx:2},
  {id:13,tx:7,rx:4},{id:14,tx:2,rx:6},{id:15,tx:2,rx:7},
  {id:16,tx:1,rx:8},{id:17,tx:1,rx:2},{id:18,tx:4,rx:5},
  {id:19,tx:1,rx:4},{id:20,tx:4,rx:6},{id:21,tx:3,rx:2},
];

// ── SENSOR POSITIONS (for visualization)
var SENSOR_POS = {
  '1':{x:0,y:240},'2':{x:220,y:320},'3':{x:0,y:160},
  '4':{x:360,y:320},'5':{x:0,y:80},'6':{x:580,y:240},
  '7':{x:580,y:160},'8':{x:580,y:80},
};

// ── LEAK DETECTION PATHS (9 paths)
var LEAK_PATHS = [
  {id:1, desc:'SH1 — Lt.12 Superheater 1 Sisi Timur'},
  {id:2, desc:'SH2 — Lt.12 Superheater 2 Sisi Selatan'},
  {id:3, desc:'SH3 — Lt.12 Superheater 3 Sisi Barat', defaultNA:true},
  {id:4, desc:'FRH1 — Lt.12 Reheater 1 Sisi Timur',  defaultNA:true},
  {id:5, desc:'FRH2 — Lt.12 Reheater 2 Sisi Barat'},
  {id:6, desc:'ECON 6 — Lt.10.5 Economizer Sisi Timur'},
  {id:7, desc:'ECON 7 — Lt.10.5 Economizer Sisi Utara'},
  {id:8, desc:'ECON 8 — Lt.10.5 Economizer Sisi Barat'},
  {id:9, desc:'BS 09 — Lt.2 Bottom Slope Sisi Barat'},
];

// ── GLOBAL STATE VARIABLES
var pathData   = [];
var metaInfo   = {tanggal:'—', shift:'—', operator:'—'};
var diagResults= {};
var rawHeaders = [];
var rawRows    = [];
var wsData     = null;
var activeTab  = 'upload';
var currentRecordId = null;

// ── KEYWORD PATTERNS FOR EXCEL COLUMN DETECTION
var TEMP_KEYS   = ['reading temp','reading','temp','suhu','temperature','°c','deg'];
var STATUS_KEYS = ['status'];
var DATE_KEYS   = ['tanggal','date','tgl'];
var SHIFT_KEYS  = ['shift'];
var OP_KEYS     = ['operator','nama','name'];
var PATH_KEYS   = ['path'];
