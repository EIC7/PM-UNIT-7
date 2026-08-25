-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 003: Izinkan revisi laporan RETURNED -> DRAFT
--
-- MASALAH: sql/001 sudah punya transisi status DRAFT->SUBMITTED->CHECKED
-- ->FINAL_APPROVED/RETURNED, tapi TIDAK ADA jalan balik dari RETURNED ke
-- DRAFT untuk role 'user' biasa -- cuma admin (lewat pm_records_admin_all)
-- yang bisa. Padahal maksudnya "Dikembalikan" itu supaya user BISA
-- merevisi & kirim ulang sendiri, bukan mentok butuh admin tiap kali.
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard ->
-- SQL Editor -> Run. Jalankan SETELAH migration 001 & 002.
-- ═══════════════════════════════════════════════════════════════════════

drop policy if exists "pm_records_revise_returned" on pm_records;
create policy "pm_records_revise_returned" on pm_records
  for update using (status = 'RETURNED' and pm_current_role() in ('user','admin'))
  with check (status = 'DRAFT');

-- ── SELESAI ──────────────────────────────────────────────────────────
-- Setelah ini: laporan berstatus RETURNED bisa dibuka lagi jadi DRAFT
-- oleh siapa pun yang login dengan role 'user' atau 'admin' (lewat tombol
-- "Revisi & Kirim Ulang" di maintenance_report_form.html), lalu diedit
-- dan di-submit ulang seperti laporan baru.
