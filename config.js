// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
var SUPA_URL = 'https://ruvvximnnacpvvoogbzs.supabase.co';
var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkwMjc2NDgsImV4cCI6MTk5NDYwMzY0OH0.YKI2HkXMGVvIlJ0DvhwREVklH1RmP8h47gYtLaLWfBA';
var SUPA_TABLE = 'pm_records';

// ============================================================
// UNIT & PLANT INFO
// ============================================================
var UNIT = 'Unit 7';
var PLANT = 'PT POMI - PLTU Paiton';

// ============================================================
// BELT SCALE CONFIGURATIONS
// ============================================================
var BS_CONFIGS = {
  e45: {
    key: 'e45',
    mod: 'Belt Scale Conveyor E4/E5',
    modul_name: 'BELT CONVEYOR E4-E5',
    doc: '7BG-INS-050-00',
    title: 'Monthly Inspection - Belt Scale Conveyor',
    subtitle: 'E4-E5 (East 4 & East 5)',
    label: 'Belt Conveyor E4-E5 Inspection',
    a: { code: 'E4', name: 'East 4', note: 'Panel E4 Condition' },
    b: { code: 'E5', name: 'East 5', note: 'Panel E5 Condition' }
  },
  e23: {
    key: 'e23',
    mod: 'Belt Scale Conveyor E2/E3',
    modul_name: 'BELT CONVEYOR E2-E3',
    doc: '7BG-INS-050-00',
    title: 'Monthly Inspection - Belt Scale Conveyor',
    subtitle: 'E2-E3 (East 2 & East 3)',
    label: 'Belt Conveyor E2-E3 Inspection',
    a: { code: 'E2', name: 'East 2', note: 'Panel E2 Condition' },
    b: { code: 'E3', name: 'East 3', note: 'Panel E3 Condition' }
  },
  b12: {
    key: 'b12',
    mod: 'Belt Scale Conveyor B1/B2',
    modul_name: 'BELT CONVEYOR B1-B2',
    doc: '7BG-INS-050-00',
    title: 'Monthly Inspection - Belt Scale Conveyor',
    subtitle: 'B1-B2 (Buffer 1 & Buffer 2)',
    label: 'Belt Conveyor B1-B2 Inspection',
    a: { code: 'B1', name: 'Buffer 1', note: 'Panel B1 Condition' },
    b: { code: 'B2', name: 'Buffer 2', note: 'Panel B2 Condition' }
  }
};

// ============================================================
// BELT SCALE CHECKS (SHARED)
// ============================================================
var BS_CHECKS = [
  {no:'1', label:'Visual Inspection: Check for physical damage, wear, corrosion, cracks.', criteria:'No damage\nNo corrosion\nNo wear', type:'check'},
  {no:'2', label:'Check belt tension and alignment (no slipping, no drift).', criteria:'Proper tension\nCenter alignment\nNo slipping', type:'check'},
  {no:'3', label:'Lubricating: Apply proper lubricant on pulleys, bearing, and chain.', criteria:'Lubricated\nNo excess grease\nClean', type:'check'},
  {no:'4', label:'Make sure all sealing panel, conduit connection is good (no dust & water ingress into inside of panel/conduit). * replace if required', criteria:'No dust or dirty\nNo Sign of water ingress\nNo broken condition', type:'check'},
  {no:'5', label:'Check connection was tightened and no looses.', criteria:'Tight Connection', type:'check'},
  {no:'6', label:'Belt Scale Calibration', criteria:'', type:'header'},
  {no:'6a', label:'Error Zero Calibration', criteria:'', type:'input', placeholder:'e.g. 0.01%'},
  {no:'6b', label:'New Zero Change Value', criteria:'', type:'input', placeholder:'e.g. 966048'},
  {no:'6c', label:'Old Zero Change Value', criteria:'', type:'input', placeholder:'e.g. 966149'},
  {no:'9', label:'Raise new WO & repair if any defect found.', criteria:'', type:'check'},
  {no:'10', label:'Leave the location within safe condition.', criteria:'', type:'check'}
];

// ============================================================
// FEGT CHECKS
// ============================================================
var FEGT_CHECKS = [
  {no:'1', label:'Measure FEGT temperature at both Temperature element.', criteria:'Record both readings', type:'check'},
  {no:'2', label:'Check leakage at piping, flange, and valve connection (steam and condensate line).', criteria:'No leakage\nNo corrosion\nNo worn', type:'check'},
  {no:'3', label:'Check isolation valve condition and accessibility (operate isolation valve to ensure smooth operation).', criteria:'Smooth operation\nNo corrosion\nNo binding', type:'check'},
  {no:'4', label:'Check for signs of vibration, unusual noise, or abnormal operation.', criteria:'No vibration\nNo unusual noise\nNormal operation', type:'check'},
  {no:'5', label:'Check condensate drain and air vent function (make sure blockage free).', criteria:'Clear drain\nClear vent\nNo blockage', type:'check'},
  {no:'6', label:'Perform function test: isolate FEGT and check if DCS reading respond appropriately.', criteria:'DCS responsive\nIsolation works', type:'check'}
];

// ============================================================
// SO2 CHECKS
// ============================================================
var SO2_CHECKS = [
  {no:'1', label:'Mechanical Inspection: Check for corrosion, sediment buildup, and physical damage', criteria:'No corrosion\nNo sediment\nNo damage', type:'check'},
  {no:'2', label:'Check inlet piping condition (no leakage, no blockage)', criteria:'No leakage\nNo blockage\nClear flow', type:'check'},
  {no:'3', label:'Check analyzer sample line (no blockage)', criteria:'Clear line\nNo blockage', type:'check'},
  {no:'4', label:'Verify calibration procedure performed as per schedule', criteria:'Calibration done\nRecords available', type:'check'},
  {no:'5', label:'Verify DCS alarm and sensor function', criteria:'DCS responsive\nAlarm working', type:'check'},
  {no:'6', label:'Record analyzer readings from DCS and Local Display', criteria:'DCS reading\nLocal reading', type:'check'}
];

// ============================================================
// OPACITY CHECKS
// ============================================================
var OP_CHECKS = [
  {no:'1', label:'Clean optical window and lens (use soft cloth or compressed air).', criteria:'Clean\nNo dust\nNo obstruction', hasCheck:true, both:true},
  {no:'2', label:'Check laser alignment and beam path (verify laser is correctly aimed).', criteria:'Aligned\nClear path', hasCheck:true, both:true},
  {no:'3', label:'Check photodetector function (verify detector is responsive).', criteria:'Responsive\nNo obstruction', hasCheck:true, both:true},
  {no:'4', label:'Perform calibration per schedule (zero calibration & span calibration).', criteria:'Calibrated\nRecords available', hasCheck:true, both:true},
  {no:'5', label:'Record monitor reading from DCS and Local Display', criteria:'DCS reading\nLocal reading', hasCheck:true, both:true},
  {no:'6a', label:'7A Inspection: Visual check for condensation, dirt, or physical damage on optical surfaces', criteria:'Clean\nNo condensation\nNo damage', hasCheck:true, both:false},
  {no:'6b', label:'7B Inspection: Visual check for condensation, dirt, or physical damage on optical surfaces', criteria:'Clean\nNo condensation\nNo damage', hasCheck:true, both:true},
  {no:'7', label:'Check signal cable and connectors for damage or corrosion', criteria:'No damage\nNo corrosion\nSecure connection', hasCheck:true, both:true},
  {no:'8', label:'Verify DCS readout accuracy (compare with local display if available).', criteria:'DCS accurate\nMatches display', hasCheck:true, both:true},
  {no:'6c', label:'Cleaning Mirror/lens, chamber opacity, record if any abnormality found.', criteria:'', hasCheck:true, both:true}
];

// ============================================================
// EXPORT ALL CONFIGS
// ============================================================
// (These are global variables, no export needed)
