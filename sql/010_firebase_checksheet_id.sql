-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 010: Simpan Firestore checksheetId per laporan, buat baca
-- balik status review/approval sungguhan dari Review Approval Dashboard
--
-- Konteks: history.html cuma tahu "sudah terkirim ke Review Approval
-- Dashboard" (firebase_synced_at) atau belum -- tidak pernah tahu status
-- SEBENARNYA di sana (menunggu review / menunggu approval / disetujui /
-- dikembalikan ke teknisi), karena checksheetId hasil DB.save() cuma
-- dipakai sekali pakai di memory (buat manggil Approvals.submitWithFiles)
-- lalu dibuang, tidak pernah disimpan balik ke Supabase.
--
-- Kolom ini diisi shared.js (raSendFinalPdfToFirebaseDashboard) setiap
-- kali submit/resubmit SUKSES -- history.html lalu pakai nilai ini untuk
-- query Approvals.getByChecksheetId(id) langsung ke Firestore dan
-- menampilkan status sungguhannya.
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run (setelah 001-009).
-- ═══════════════════════════════════════════════════════════════════════

alter table pm_records
  add column if not exists firebase_checksheet_id text;

-- Tidak perlu policy RLS baru -- kolom ini di-PATCH bersamaan dengan
-- firebase_synced_at dalam satu request yang sama, sudah tercakup policy
-- "pm_records_update_submitted_metadata" dari migration 009.

-- ── SELESAI ──────────────────────────────────────────────────────────
