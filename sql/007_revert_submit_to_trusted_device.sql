-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 007: Revert Submit Laporan ke Trusted Device (tanpa login akun)
--
-- Konteks: atas permintaan user, gerbang login akun (username/password
-- per-orang lewat Supabase Auth) DIHAPUS dari seluruh halaman PM Unit 7.
-- Akses kembali sepenuhnya ke Trusted Device (gerbang device-password di
-- shared.js) -- checker/reviewer/SPV role-based workflow juga dihapus dari
-- UI (lihat maintenance_report_form.html, submit-report.html,
-- device-admin.html). raSubmitReport() (shared.js) sekarang TIDAK lagi
-- login dulu sebelum submit -- klien yang menyimpan pakai anon key polos.
--
-- Tanpa migration ini, klik "Submit Laporan" akan GAGAL (RLS menolak),
-- karena policy lama "pm_records_submit_authenticated" (migration 001)
-- mewajibkan pm_current_role() = 'user'/'admin' (harus login).
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run (setelah 001-006).
--
-- CATATAN KEAMANAN: ini SENGAJA membuka transisi DRAFT -> SUBMITTED untuk
-- siapa pun yang bisa memanggil anon key (persis seperti update DRAFT ->
-- DRAFT yang sudah dari dulu terbuka lewat "pm_records_update_draft_anon").
-- Proteksi satu-satunya sekarang murni di level aplikasi (Trusted Device
-- di shared.js), bukan lagi di database -- sama seperti sebelum migration
-- 001 ada. Policy "pm_records_checker_update" / "pm_records_reviewer_update"
-- (masih butuh login checker/reviewer) dibiarkan apa adanya -- tidak lagi
-- dipakai UI mana pun, tapi tidak mengganggu apa pun kalau dibiarkan.
-- ═══════════════════════════════════════════════════════════════════════

drop policy if exists "pm_records_submit_authenticated" on pm_records;
create policy "pm_records_submit_authenticated" on pm_records
  for update using (status = 'DRAFT')
  with check (status = 'SUBMITTED');

-- ── SELESAI ──────────────────────────────────────────────────────────
