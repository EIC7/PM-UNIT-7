-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 003: Edit isi laporan di tempat, TANPA ikut mengubah status
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run (setelah 001 & 002).
--
-- KENAPA MIGRATION INI DIBUTUHKAN:
-- Tombol "Edit" di Submit Report.html membuka halaman modul aslinya
-- (mis. so2.html?id=xxx) supaya Checker/SPV bisa membetulkan isi laporan
-- SEBELUM verifikasi/approve (verifikasi/approve sendiri sekarang
-- dilakukan terpusat di Submit Report.html, bukan lagi di halaman modul).
-- Policy 001 cuma mengizinkan UPDATE kalau SEKALIGUS transisi status
-- (SUBMITTED->CHECKED, CHECKED->FINAL_APPROVED, dst) -- edit isi data
-- SAJA tanpa pindah status (mis. checker perbaiki angka lalu simpan,
-- belum tentu langsung verifikasi) belum ada jalannya sama sekali.
-- ═══════════════════════════════════════════════════════════════════════

-- Checker/admin boleh update isi (data/tanggal/pic/work_order) selama
-- record MASIH SUBMITTED, status TETAP SUBMITTED (bukan transisi).
drop policy if exists "pm_records_checker_edit_in_place" on pm_records;
create policy "pm_records_checker_edit_in_place" on pm_records
  for update using (status = 'SUBMITTED' and pm_current_role() in ('checker','admin'))
  with check (status = 'SUBMITTED');

-- Reviewer/admin boleh update isi selama record MASIH CHECKED, status
-- TETAP CHECKED.
drop policy if exists "pm_records_reviewer_edit_in_place" on pm_records;
create policy "pm_records_reviewer_edit_in_place" on pm_records
  for update using (status = 'CHECKED' and pm_current_role() in ('reviewer','admin'))
  with check (status = 'CHECKED');

-- CATATAN: policy permissive di Postgres RLS di-OR-kan, jadi ini aditif
-- terhadap "pm_records_checker_update"/"pm_records_reviewer_update" dari
-- 001 (yang mengizinkan transisi status) -- keduanya sama-sama berlaku,
-- checker/reviewer sekarang bisa EDIT-TANPA-TRANSISI (policy ini) ATAU
-- EDIT-SEKALIGUS-TRANSISI (policy 001) sesuai aksi yang mereka lakukan.

-- ── SELESAI ──────────────────────────────────────────────────────────
