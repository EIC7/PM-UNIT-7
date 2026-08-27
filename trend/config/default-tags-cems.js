/**
 * ==========================================================================
 * DEFAULT TAGS — CEMS Calibration
 * ==========================================================================
 * Sumber: cems_calibration.html (modul Supabase 'CEMS Calibration').
 * Lihat js/adapters/cems-adapter.js untuk detail struktur data mentahnya.
 *
 * 10 parameter x 4 tab frekuensi kalibrasi (2-Weekly #1, 2-Weekly #2,
 * Monthly, 2-Yearly) = 40 tag total. Tiap tag = 1 parameter di 1 tab
 * frekuensi tertentu, dengan 2 series: Actual (pembacaan CEMS) vs Expected
 * (nilai reference gas kalibrasi) -- pola sama dengan DCS/Local di SO2.
 *
 * DEFAULT VISIBLE: cuma SO2-ZERO & SO2-SPAN1 yang nyala dari awal di tiap
 * tab (parameter paling sering jadi acuan utama kalibrasi CEMS) -- sisanya
 * tersedia lewat checkbox, supaya chart tidak langsung penuh 10 tag x 2
 * series sekaligus.
 *
 * ENGINEERING RANGE: ASUMSI rentang tipikal CEMS batubara (SO2/NOx/CO span
 * gas ~ratusan ppm, CO2 0-20%, O2 0-25%) -- sesuaikan kalau ada spesifikasi
 * gas kalibrasi aktual dari instrumen.
 * ==========================================================================
 */
window.DCS_DEFAULT_TAGS = [

  {
  id: 'CEMS-W1-SO2-ZERO',
  name: 'CEMS SO2 Zero (2-Weekly #1)',
  description: 'SO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2121' },
    { key: 'Expected', label: 'Expected', color: '#ca7e72' }
  ]
},
  {
  id: 'CEMS-W1-SO2-SPAN1',
  name: 'CEMS SO2 Span1 (2-Weekly #1)',
  description: 'SO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9c691e' },
    { key: 'Expected', label: 'Expected', color: '#bea254' }
  ]
},
  {
  id: 'CEMS-W1-SO2-SPAN2',
  name: 'CEMS SO2 Span2 (2-Weekly #1)',
  description: 'SO2 Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#667917' },
    { key: 'Expected', label: 'Expected', color: '#78983a' }
  ]
},
  {
  id: 'CEMS-W1-NOX-ZERO',
  name: 'CEMS NOx Zero (2-Weekly #1)',
  description: 'NOx Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#246613' },
    { key: 'Expected', label: 'Expected', color: '#3e9338' }
  ]
},
  {
  id: 'CEMS-W1-NOX-SPAN2',
  name: 'CEMS NOx Span2 (2-Weekly #1)',
  description: 'NOx Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#1a8946' },
    { key: 'Expected', label: 'Expected', color: '#4ebc89' }
  ]
},
  {
  id: 'CEMS-W1-CO-ZERO',
  name: 'CEMS CO Zero (2-Weekly #1)',
  description: 'CO Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#21abab' },
    { key: 'Expected', label: 'Expected', color: '#72beca' }
  ]
},
  {
  id: 'CEMS-W1-CO-SPAN1',
  name: 'CEMS CO Span1 (2-Weekly #1)',
  description: 'CO Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 1000,
  min: 0,
  max: 1000,
  chartMax: 1100,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#2158ab' },
    { key: 'Expected', label: 'Expected', color: '#728aca' }
  ]
},
  {
  id: 'CEMS-W1-CO2-ZERO',
  name: 'CEMS CO2 Zero (2-Weekly #1)',
  description: 'CO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 5,
  min: 0,
  max: 5,
  chartMax: 6,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#3c21ab' },
    { key: 'Expected', label: 'Expected', color: '#9072ca' }
  ]
},
  {
  id: 'CEMS-W1-CO2-SPAN1',
  name: 'CEMS CO2 Span1 (2-Weekly #1)',
  description: 'CO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 20,
  min: 0,
  max: 20,
  chartMax: 22,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9021ab' },
    { key: 'Expected', label: 'Expected', color: '#c472ca' }
  ]
},
  {
  id: 'CEMS-W1-O2-ZERO',
  name: 'CEMS O2 Zero (2-Weekly #1)',
  description: 'O2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #1',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 25,
  min: 0,
  max: 25,
  chartMax: 26,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2174' },
    { key: 'Expected', label: 'Expected', color: '#ca729b' }
  ]
},
  {
  id: 'CEMS-W2-SO2-ZERO',
  name: 'CEMS SO2 Zero (2-Weekly #2)',
  description: 'SO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2121' },
    { key: 'Expected', label: 'Expected', color: '#ca7e72' }
  ]
},
  {
  id: 'CEMS-W2-SO2-SPAN1',
  name: 'CEMS SO2 Span1 (2-Weekly #2)',
  description: 'SO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9c691e' },
    { key: 'Expected', label: 'Expected', color: '#bea254' }
  ]
},
  {
  id: 'CEMS-W2-SO2-SPAN2',
  name: 'CEMS SO2 Span2 (2-Weekly #2)',
  description: 'SO2 Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#667917' },
    { key: 'Expected', label: 'Expected', color: '#78983a' }
  ]
},
  {
  id: 'CEMS-W2-NOX-ZERO',
  name: 'CEMS NOx Zero (2-Weekly #2)',
  description: 'NOx Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#246613' },
    { key: 'Expected', label: 'Expected', color: '#3e9338' }
  ]
},
  {
  id: 'CEMS-W2-NOX-SPAN2',
  name: 'CEMS NOx Span2 (2-Weekly #2)',
  description: 'NOx Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#1a8946' },
    { key: 'Expected', label: 'Expected', color: '#4ebc89' }
  ]
},
  {
  id: 'CEMS-W2-CO-ZERO',
  name: 'CEMS CO Zero (2-Weekly #2)',
  description: 'CO Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#21abab' },
    { key: 'Expected', label: 'Expected', color: '#72beca' }
  ]
},
  {
  id: 'CEMS-W2-CO-SPAN1',
  name: 'CEMS CO Span1 (2-Weekly #2)',
  description: 'CO Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 1000,
  min: 0,
  max: 1000,
  chartMax: 1100,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#2158ab' },
    { key: 'Expected', label: 'Expected', color: '#728aca' }
  ]
},
  {
  id: 'CEMS-W2-CO2-ZERO',
  name: 'CEMS CO2 Zero (2-Weekly #2)',
  description: 'CO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 5,
  min: 0,
  max: 5,
  chartMax: 6,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#3c21ab' },
    { key: 'Expected', label: 'Expected', color: '#9072ca' }
  ]
},
  {
  id: 'CEMS-W2-CO2-SPAN1',
  name: 'CEMS CO2 Span1 (2-Weekly #2)',
  description: 'CO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 20,
  min: 0,
  max: 20,
  chartMax: 22,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9021ab' },
    { key: 'Expected', label: 'Expected', color: '#c472ca' }
  ]
},
  {
  id: 'CEMS-W2-O2-ZERO',
  name: 'CEMS O2 Zero (2-Weekly #2)',
  description: 'O2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Weekly #2',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 25,
  min: 0,
  max: 25,
  chartMax: 26,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2174' },
    { key: 'Expected', label: 'Expected', color: '#ca729b' }
  ]
},
  {
  id: 'CEMS-M-SO2-ZERO',
  name: 'CEMS SO2 Zero (Monthly)',
  description: 'SO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2121' },
    { key: 'Expected', label: 'Expected', color: '#ca7e72' }
  ]
},
  {
  id: 'CEMS-M-SO2-SPAN1',
  name: 'CEMS SO2 Span1 (Monthly)',
  description: 'SO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9c691e' },
    { key: 'Expected', label: 'Expected', color: '#bea254' }
  ]
},
  {
  id: 'CEMS-M-SO2-SPAN2',
  name: 'CEMS SO2 Span2 (Monthly)',
  description: 'SO2 Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#667917' },
    { key: 'Expected', label: 'Expected', color: '#78983a' }
  ]
},
  {
  id: 'CEMS-M-NOX-ZERO',
  name: 'CEMS NOx Zero (Monthly)',
  description: 'NOx Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#246613' },
    { key: 'Expected', label: 'Expected', color: '#3e9338' }
  ]
},
  {
  id: 'CEMS-M-NOX-SPAN2',
  name: 'CEMS NOx Span2 (Monthly)',
  description: 'NOx Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#1a8946' },
    { key: 'Expected', label: 'Expected', color: '#4ebc89' }
  ]
},
  {
  id: 'CEMS-M-CO-ZERO',
  name: 'CEMS CO Zero (Monthly)',
  description: 'CO Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#21abab' },
    { key: 'Expected', label: 'Expected', color: '#72beca' }
  ]
},
  {
  id: 'CEMS-M-CO-SPAN1',
  name: 'CEMS CO Span1 (Monthly)',
  description: 'CO Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 1000,
  min: 0,
  max: 1000,
  chartMax: 1100,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#2158ab' },
    { key: 'Expected', label: 'Expected', color: '#728aca' }
  ]
},
  {
  id: 'CEMS-M-CO2-ZERO',
  name: 'CEMS CO2 Zero (Monthly)',
  description: 'CO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 5,
  min: 0,
  max: 5,
  chartMax: 6,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#3c21ab' },
    { key: 'Expected', label: 'Expected', color: '#9072ca' }
  ]
},
  {
  id: 'CEMS-M-CO2-SPAN1',
  name: 'CEMS CO2 Span1 (Monthly)',
  description: 'CO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 20,
  min: 0,
  max: 20,
  chartMax: 22,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9021ab' },
    { key: 'Expected', label: 'Expected', color: '#c472ca' }
  ]
},
  {
  id: 'CEMS-M-O2-ZERO',
  name: 'CEMS O2 Zero (Monthly)',
  description: 'O2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi Monthly',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 25,
  min: 0,
  max: 25,
  chartMax: 26,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2174' },
    { key: 'Expected', label: 'Expected', color: '#ca729b' }
  ]
},
  {
  id: 'CEMS-Y-SO2-ZERO',
  name: 'CEMS SO2 Zero (2-Yearly)',
  description: 'SO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2121' },
    { key: 'Expected', label: 'Expected', color: '#ca7e72' }
  ]
},
  {
  id: 'CEMS-Y-SO2-SPAN1',
  name: 'CEMS SO2 Span1 (2-Yearly)',
  description: 'SO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: true,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9c691e' },
    { key: 'Expected', label: 'Expected', color: '#bea254' }
  ]
},
  {
  id: 'CEMS-Y-SO2-SPAN2',
  name: 'CEMS SO2 Span2 (2-Yearly)',
  description: 'SO2 Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#667917' },
    { key: 'Expected', label: 'Expected', color: '#78983a' }
  ]
},
  {
  id: 'CEMS-Y-NOX-ZERO',
  name: 'CEMS NOx Zero (2-Yearly)',
  description: 'NOx Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#246613' },
    { key: 'Expected', label: 'Expected', color: '#3e9338' }
  ]
},
  {
  id: 'CEMS-Y-NOX-SPAN2',
  name: 'CEMS NOx Span2 (2-Yearly)',
  description: 'NOx Span2 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 500,
  min: 0,
  max: 500,
  chartMax: 550,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#1a8946' },
    { key: 'Expected', label: 'Expected', color: '#4ebc89' }
  ]
},
  {
  id: 'CEMS-Y-CO-ZERO',
  name: 'CEMS CO Zero (2-Yearly)',
  description: 'CO Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 50,
  min: 0,
  max: 50,
  chartMax: 60,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#21abab' },
    { key: 'Expected', label: 'Expected', color: '#72beca' }
  ]
},
  {
  id: 'CEMS-Y-CO-SPAN1',
  name: 'CEMS CO Span1 (2-Yearly)',
  description: 'CO Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: 'ppm',
  engineeringLow: 0,
  engineeringHigh: 1000,
  min: 0,
  max: 1000,
  chartMax: 1100,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#2158ab' },
    { key: 'Expected', label: 'Expected', color: '#728aca' }
  ]
},
  {
  id: 'CEMS-Y-CO2-ZERO',
  name: 'CEMS CO2 Zero (2-Yearly)',
  description: 'CO2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 5,
  min: 0,
  max: 5,
  chartMax: 6,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#3c21ab' },
    { key: 'Expected', label: 'Expected', color: '#9072ca' }
  ]
},
  {
  id: 'CEMS-Y-CO2-SPAN1',
  name: 'CEMS CO2 Span1 (2-Yearly)',
  description: 'CO2 Span1 -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 20,
  min: 0,
  max: 20,
  chartMax: 22,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#9021ab' },
    { key: 'Expected', label: 'Expected', color: '#c472ca' }
  ]
},
  {
  id: 'CEMS-Y-O2-ZERO',
  name: 'CEMS O2 Zero (2-Yearly)',
  description: 'O2 Zero -- pembacaan CEMS (Actual) vs reference gas kalibrasi (Expected), frekuensi 2-Yearly',
  unit: '%',
  engineeringLow: 0,
  engineeringHigh: 25,
  min: 0,
  max: 25,
  chartMax: 26,
  alarmLowLow: null, alarmLow: null, alarmHigh: null, alarmHighHigh: null,
  visible: false,
  enabled: true,
  source: 'supabase:pm_records',
  sourceModul: 'CEMS Calibration',
  updateInterval: null,
  series: [
    { key: 'Actual',   label: 'Actual',   color: '#ab2174' },
    { key: 'Expected', label: 'Expected', color: '#ca729b' }
  ]
}
];
