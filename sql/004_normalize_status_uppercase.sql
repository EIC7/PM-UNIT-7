-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 004: Normalisasi kolom status ke UPPERCASE + pastikan
-- CHECK constraint benar-benar aktif melindunginya
--
-- MASALAH: ditemukan record dengan status = 'draft' (huruf kecil) di
-- database, padahal seluruh kode JS selalu menulis 'DRAFT' (uppercase).
-- Perbandingan status === 'DRAFT' di maintenance_report_form.html itu
-- case-sensitive -- kalau ketemu 'draft' (huruf kecil), TIDAK ADA kotak
-- workflow (Submit/Checker/Reviewer/dst) yang cocok ditampilkan, kelihatan
-- seperti area workflow kosong/rusak.
--
-- KEMUNGKINAN PENYEBAB: kolom `status` sempat ditambahkan sebelum
-- migration 001 (mis. versi awal development), dan `add column if not
-- exists ... check (...)` di migration 001 SENGAJA melewati (skip) baris
-- itu KALAU kolomnya sudah ada duluan -- termasuk CHECK constraint-nya
-- juga ikut tidak terpasang. Migration ini membetulkan data yang sudah
-- terlanjur salah, DAN memastikan constraint-nya benar-benar ada
-- (drop+add, bukan if-not-exists, supaya tidak silently ke-skip lagi).
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard ->
-- SQL Editor -> Run.
-- ═══════════════════════════════════════════════════════════════════════

-- LANGKAH 1: cek dulu, ada berapa banyak & yang mana yang kena
select id, modul, tanggal, status
from pm_records
where status is distinct from upper(status);

-- LANGKAH 2: normalisasi semua ke UPPERCASE
update pm_records
set status = upper(status)
where status is distinct from upper(status);

-- LANGKAH 3: pastikan CHECK constraint benar-benar terpasang (drop dulu
-- kalau ada versi lama yang salah/tidak lengkap, baru pasang ulang --
-- supaya kejadian ini tidak berulang untuk data BARU ke depannya)
alter table pm_records drop constraint if exists pm_records_status_check;
alter table pm_records add constraint pm_records_status_check
  check (status in ('DRAFT','SUBMITTED','CHECKED','FINAL_APPROVED','RETURNED'));

-- Verifikasi akhir: harusnya 0 baris (semua sudah uppercase & valid)
select id, status from pm_records
where status not in ('DRAFT','SUBMITTED','CHECKED','FINAL_APPROVED','RETURNED');

-- ── SELESAI ──────────────────────────────────────────────────────────
