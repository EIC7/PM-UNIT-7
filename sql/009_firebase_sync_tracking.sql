-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 009: Lacak status kirim PDF ke Review Approval Dashboard
-- (Firebase) + retry otomatis
--
-- Konteks: ditemukan laporan yang statusnya sudah SUBMITTED di Supabase
-- tapi TIDAK PERNAH sampai ke Review Approval Dashboard (Firebase) --
-- root cause: raSubmitReportCore() (shared.js) melapor "selesai" ke
-- pemanggilnya SEKETIKA setelah status Supabase ter-update, TANPA
-- menunggu proses build-PDF + upload ke Firebase (yang lebih lambat,
-- terutama checksheet dengan banyak foto) benar-benar tuntas. Kalau
-- pemanggilnya adalah iframe tersembunyi (submit langsung dari
-- history.html), iframe itu keburu dibuang sebelum uploadnya selesai --
-- laporan "nyangkut": SUBMITTED di Supabase, tidak pernah nyampe Firebase.
--
-- Perbaikan sisi kode (shared.js): raSendFinalPdfToFirebaseDashboard()
-- sekarang benar-benar menunggu proses selesai sebelum melapor balik, DAN
-- ada raRetryPendingFirebaseSyncs() yang otomatis coba kirim ulang laporan
-- yang belum sukses SETIAP kali halaman mana pun di situs ini dibuka
-- (selama ada koneksi) -- kolom di migration ini yang dipakai untuk tahu
-- laporan mana saja yang masih "nyangkut".
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run (setelah 001-007).
-- ═══════════════════════════════════════════════════════════════════════

alter table pm_records
  add column if not exists firebase_synced_at timestamptz,
  add column if not exists firebase_sync_error text;

-- Izinkan anon key membetulkan kolom bookkeeping di atas (dan mengirim
-- ulang PDF) pada record yang SUDAH SUBMITTED, TANPA pindah status lagi.
-- Policy "pm_records_submit_authenticated" (migration 001, dilonggarkan di
-- 007) cuma mengizinkan transisi DARI status DRAFT -- baris yang statusnya
-- SUDAH SUBMITTED tidak match policy itu sama sekali.
drop policy if exists "pm_records_update_submitted_metadata" on pm_records;
create policy "pm_records_update_submitted_metadata" on pm_records
  for update using (status = 'SUBMITTED')
  with check (status = 'SUBMITTED');

-- ── SELESAI ──────────────────────────────────────────────────────────
