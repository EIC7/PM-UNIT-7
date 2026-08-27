-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 006: Kolom Komentar & Rekomendasi untuk Checker dan SPV
-- (Reviewer) di submit-report.html
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run (setelah 001-005).
--
-- Aditif saja -- kolom baru, tidak mengubah kolom/data yang sudah ada.
-- RLS tidak perlu diubah: policy "pm_records_checker_update" dan
-- "pm_records_reviewer_update" (migration 001) mengizinkan UPDATE
-- berdasarkan status + role, bukan berdasarkan nama kolom, jadi kolom
-- baru ini otomatis ikut ter-cover.
-- ═══════════════════════════════════════════════════════════════════════

alter table pm_records
  add column if not exists checked_comment text,
  add column if not exists checked_recommendation text,
  add column if not exists review_comment text,
  add column if not exists review_recommendation text;

-- ── SELESAI ──────────────────────────────────────────────────────────
