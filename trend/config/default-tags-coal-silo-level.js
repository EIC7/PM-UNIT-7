/**
 * ==========================================================================
 * DEFAULT TAGS — Coal Silo Level Transmitter
 * ==========================================================================
 * Sumber: coal-silo-level.html (modul Supabase 'Coal Silo Level
 * Transmitter'). Lihat js/adapters/coal-silo-level-adapter.js.
 *
 * 6 unit (BF-LI-500A..F) = 6 tag. Tiap unit checksheet punya 14 langkah
 * 'measure' (As Found/As Left per langkah — lihat CSL_STEPS di source).
 * Series utama per tag: DCSReading (As Found) vs DCSReadingAsLeft (As Left)
 * — analog pola Before/After di so2.html, dipasangkan lewat deviationPairs
 * di modules/coal-silo-level.config.js. 12 langkah sisanya (Omron Reading,
 * Scaling Point Input/Display A1/A2, Load Cell 1-4 Voltage/Output) ikut
 * terdaftar tapi defaultVisible:false — tersedia lewat toggle TAG LIST,
 * tidak bikin chart utama penuh sesak.
 *
 * ENGINEERING RANGE 0-100%: "DCS Reading" bertipe Percentage (%) per
 * kolom criteria di CSL_STEPS — ASUMSI level silo 0-100%, sesuaikan kalau
 * ada rentang instrumen aktual.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = window.DCS_DEFAULT_TAGS || [];

var CSL_UNIT_LIST = ['BF-LI-500A', 'BF-LI-500B', 'BF-LI-500C', 'BF-LI-500D', 'BF-LI-500E', 'BF-LI-500F'];

var CSL_PRIMARY_COLOR_PAIRS = [
  ['#ab2121', '#ca7e72'], ['#9c691e', '#bea254'], ['#246613', '#3e9338'],
  ['#1a5c8f', '#5c9dc9'], ['#5c3d8f', '#9072ca'], ['#8f5c1a', '#c9a05c']
];

// 12 langkah 'measure' sekunder (bukan DCS Reading) -- label + unit, urutan
// sama persis MEASURE_STEPS di coal-silo-level-adapter.js (indeks 1..13,
// indeks 0 = DCSReading sudah jadi series utama di atas).
var CSL_SECONDARY_STEPS = [
  { slug: 'OmronReading',        label: 'Display Omron Reading',      unit: 'kg' },
  { slug: 'ScalePointInputA1',   label: 'Scaling Point Input A1',     unit: 'mV' },
  { slug: 'ScalePointInputA2',   label: 'Scaling Point Input A2',     unit: 'mV' },
  { slug: 'ScalePointDisplayA1', label: 'Scaling Point Display A1',   unit: '' },
  { slug: 'ScalePointDisplayA2', label: 'Scaling Point Display A2',   unit: '' },
  { slug: 'LoadCell1Voltage',    label: 'Load Cell 1 Voltage',        unit: 'Vdc' },
  { slug: 'LoadCell1Output',     label: 'Load Cell 1 Output',         unit: 'mVdc' },
  { slug: 'LoadCell2Voltage',    label: 'Load Cell 2 Voltage',        unit: 'Vdc' },
  { slug: 'LoadCell2Output',     label: 'Load Cell 2 Output',         unit: 'mVdc' },
  { slug: 'LoadCell3Voltage',    label: 'Load Cell 3 Voltage',        unit: 'Vdc' },
  { slug: 'LoadCell3Output',     label: 'Load Cell 3 Output',         unit: 'mVdc' },
  { slug: 'LoadCell4Voltage',    label: 'Load Cell 4 Voltage',        unit: 'Vdc' },
  { slug: 'LoadCell4Output',     label: 'Load Cell 4 Output',         unit: 'mVdc' }
];

// Warna sekunder sengaja tetap gelap/kontras (bukan pastel #7a8a99-style) --
// dipakai LANGSUNG sebagai warna teks label di panel VALUES (ui-manager.js),
// bukan cuma warna garis chart, jadi harus tetap terbaca sebagai teks.
var CSL_SECONDARY_COLORS = ['#3d5a70', '#7a5730', '#5e4680', '#33505c', '#6b4a2f', '#4a5c3d'];

CSL_UNIT_LIST.forEach(function (unitId, idx) {
  var pair = CSL_PRIMARY_COLOR_PAIRS[idx % CSL_PRIMARY_COLOR_PAIRS.length];
  var series = [
    { key: 'DCSReading',        label: 'DCS Reading (As Found)', color: pair[0] },
    { key: 'DCSReadingAsLeft',  label: 'DCS Reading (As Left)',  color: pair[1] }
  ];
  CSL_SECONDARY_STEPS.forEach(function (step, sIdx) {
    var c1 = CSL_SECONDARY_COLORS[sIdx % CSL_SECONDARY_COLORS.length];
    var c2 = CSL_SECONDARY_COLORS[(sIdx + 1) % CSL_SECONDARY_COLORS.length];
    series.push({ key: step.slug,            label: step.label + ' (AF)', color: c1, defaultVisible: false });
    series.push({ key: step.slug + 'AsLeft', label: step.label + ' (AL)', color: c2, defaultVisible: false });
  });

  window.DCS_DEFAULT_TAGS.push({
    id: 'CSL-' + unitId,
    name: 'Coal Silo Level ' + unitId,
    description: 'Coal Silo Level Transmitter ' + unitId + ' — DCS Reading As Found/As Left, per kejadian PM',
    unit: '%',
    engineeringLow: 0, engineeringHigh: 100, min: 0, max: 100, chartMax: 100,
    alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
    visible: true, enabled: true,
    source: 'supabase:pm_records', sourceModul: 'Coal Silo Level Transmitter', updateInterval: null,
    series: series
  });
});
