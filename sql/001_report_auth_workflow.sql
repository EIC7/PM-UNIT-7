-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Report Authentication & Approval Workflow — PM Unit 7
-- Pilot: maintenance_report_form.html
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run. Jalankan sebagai project owner (butuh akses ke
-- schema auth, tidak bisa lewat anon key dari aplikasi).
--
-- PENTING: migration ini TIDAK mengubah/menghapus apa pun yang sudah
-- ada (trusted_devices, gate_config, isi pm_records yang sudah ada).
-- Ini SEPENUHNYA aditif -- tabel baru + kolom baru + RLS baru.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Ekstensi yang dibutuhkan ─────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── 2. Tabel pm_profiles (identitas & role untuk laporan) ──────────────
-- Terpisah total dari trusted_devices (itu gerbang aplikasi, ini identitas
-- laporan). 1 baris = 1 akun Supabase Auth + role-nya.
create table if not exists pm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null check (role in ('user','checker','reviewer','admin')),
  display_name text,
  created_at timestamptz default now()
);

alter table pm_profiles enable row level security;

drop policy if exists "pm_profiles_select_authenticated" on pm_profiles;
create policy "pm_profiles_select_authenticated" on pm_profiles
  for select using (auth.role() = 'authenticated');

-- helper: role user yang sedang login (dipakai di semua policy di bawah)
create or replace function pm_current_role() returns text
language sql stable security definer set search_path = public as $$
  select role from pm_profiles where id = auth.uid();
$$;

drop policy if exists "pm_profiles_admin_write" on pm_profiles;
create policy "pm_profiles_admin_write" on pm_profiles
  for all using (pm_current_role() = 'admin')
  with check (pm_current_role() = 'admin');

-- ── 3. Kolom workflow baru di pm_records (tabel existing, TIDAK diubah
--      strukturnya, cuma ditambah) ──────────────────────────────────────
alter table pm_records
  add column if not exists status text not null default 'DRAFT'
    check (status in ('DRAFT','SUBMITTED','CHECKED','FINAL_APPROVED','RETURNED')),
  add column if not exists submitted_by uuid references pm_profiles(id),
  add column if not exists submitted_at timestamptz,
  add column if not exists checked_by_account uuid references pm_profiles(id),
  add column if not exists checked_by_name text,
  add column if not exists checked_signature_url text,
  add column if not exists checked_at timestamptz,
  add column if not exists reviewed_by_account uuid references pm_profiles(id),
  add column if not exists review_signature_url text,
  add column if not exists final_approved_at timestamptz,
  add column if not exists return_reason text;

-- ── 4. RLS di pm_records ────────────────────────────────────────────────
-- Baca (SELECT) tetap terbuka untuk semua (index/history/dashboard tidak
-- boleh rusak -- sengaja tidak diwajibkan login untuk MELIHAT).
alter table pm_records enable row level security;

drop policy if exists "pm_records_select_all" on pm_records;
create policy "pm_records_select_all" on pm_records
  for select using (true);

-- INSERT: siapa pun (anon key, belum login) boleh bikin record baru
-- SELAMA statusnya DRAFT -- ini menjaga perilaku "isi form bebas tanpa
-- login" yang sudah ada sekarang (dbSave otomatis pakai status default).
drop policy if exists "pm_records_insert_draft" on pm_records;
create policy "pm_records_insert_draft" on pm_records
  for insert with check (status = 'DRAFT');

-- UPDATE #1: siapa pun (anon key) boleh terus edit & simpan ULANG
-- selama record MASIH DRAFT (autosave/"Simpan ke Database" berkali-kali
-- sebelum submit -- tidak berubah dari perilaku sekarang).
drop policy if exists "pm_records_update_draft_anon" on pm_records;
create policy "pm_records_update_draft_anon" on pm_records
  for update using (status = 'DRAFT')
  with check (status = 'DRAFT');

-- UPDATE #2: transisi DRAFT -> SUBMITTED, HANYA oleh akun yang sudah
-- login (role user/admin) -- ini "Tingkat 1: submit wajib login dulu".
drop policy if exists "pm_records_submit_authenticated" on pm_records;
create policy "pm_records_submit_authenticated" on pm_records
  for update using (status = 'DRAFT' and pm_current_role() in ('user','admin'))
  with check (status = 'SUBMITTED');

-- UPDATE #3: Checker (role checker/admin) boleh EDIT ISI DATA + transisi
-- SUBMITTED -> CHECKED atau -> RETURNED. Ini "Tingkat 2: check, edit,
-- tanda tangan".
drop policy if exists "pm_records_checker_update" on pm_records;
create policy "pm_records_checker_update" on pm_records
  for update using (status = 'SUBMITTED' and pm_current_role() in ('checker','admin'))
  with check (status in ('CHECKED','RETURNED'));

-- UPDATE #4: Reviewer/SPV (role reviewer/admin) preview + approve final,
-- CHECKED -> FINAL_APPROVED atau -> RETURNED. Ini "Tingkat 3".
drop policy if exists "pm_records_reviewer_update" on pm_records;
create policy "pm_records_reviewer_update" on pm_records
  for update using (status = 'CHECKED' and pm_current_role() in ('reviewer','admin'))
  with check (status in ('FINAL_APPROVED','RETURNED'));

-- UPDATE #5: Admin bebas penuh (perbaikan darurat, dsb).
drop policy if exists "pm_records_admin_all" on pm_records;
create policy "pm_records_admin_all" on pm_records
  for all using (pm_current_role() = 'admin')
  with check (pm_current_role() = 'admin');

-- CATATAN KEAMANAN: Postgres RLS meng-OR-kan semua policy permissive yang
-- cocok pada satu command yang sama. Untuk pilot 1 file ini itu cukup aman
-- (tidak ada pihak eksternal/adversarial), tapi kalau nanti mau diperketat
-- lebih jauh (mis. checker TIDAK BOLEH sekalian ubah status ke
-- FINAL_APPROVED lewat trik request), kita perlu pindah ke functions
-- (RPC) khusus per aksi alih-alih UPDATE langsung dari client.

-- ── 5. Storage bucket untuk tanda tangan ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

drop policy if exists "signatures_read_authenticated" on storage.objects;
create policy "signatures_read_authenticated" on storage.objects
  for select using (bucket_id = 'signatures' and auth.role() = 'authenticated');

drop policy if exists "signatures_admin_write" on storage.objects;
create policy "signatures_admin_write" on storage.objects
  for all using (bucket_id = 'signatures' and pm_current_role() = 'admin')
  with check (bucket_id = 'signatures' and pm_current_role() = 'admin');

-- ── 6. Seed 6 akun pilot ────────────────────────────────────────────────
-- Fungsi bantu -- aman dijalankan berulang (idempotent, tinggal update
-- kalau akun sudah ada). Password di-hash pakai bcrypt (pgcrypto),
-- TIDAK pernah disimpan sebagai plaintext.
create or replace function pm_seed_account(
  p_username text, p_password text, p_role text, p_display_name text
) returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_uid uuid;
  v_email text := p_username || '@pmunit7.local';
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    v_uid := gen_random_uuid();
    -- CATATAN PENTING: kolom-kolom token di bawah (confirmation_token,
    -- recovery_token, dst) WAJIB diisi '' (string kosong), BUKAN dibiarkan
    -- NULL/default. Kalau NULL, mesin auth Supabase (GoTrue) gagal scan
    -- baris user ini pas proses LOGIN (bukan pas insert) -> error 500
    -- "Database error querying schema" di /auth/v1/token. Ini gotcha umum
    -- kalau bikin user manual lewat SQL, bukan lewat Auth API resmi.
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      role, aud, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    ) values (
      v_uid, '00000000-0000-0000-0000-000000000000', v_email,
      crypt(p_password, gen_salt('bf')), now(),
      'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '', '', '', '', '', ''
    );
  else
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')) where id = v_uid;
  end if;

  insert into pm_profiles (id, username, role, display_name)
  values (v_uid, p_username, p_role, p_display_name)
  on conflict (id) do update
    set role = excluded.role, display_name = excluded.display_name, username = excluded.username;
end;
$$;

select pm_seed_account('user1',    'percobaan1', 'user',     null);
select pm_seed_account('user2',    'percobaan1', 'user',     null);
select pm_seed_account('checker1', 'percobaan1', 'checker',  'Zaini Nur Hidayat');
select pm_seed_account('checker2', 'percobaan1', 'checker',  'Isyana Ray Sasongko');
select pm_seed_account('spv1',     'percobaan1', 'reviewer', 'Fajar Dwi Saksana');
select pm_seed_account('admin1',   'percobaan1', 'admin',    'Admin EIC Unit 7');

-- pm_seed_account SENGAJA tidak di-drop -- simpan untuk nambah akun baru
-- nanti lewat SQL Editor, mis:
--   select pm_seed_account('checker3', 'password_baru', 'checker', 'Nama Checker 3');

-- ── SELESAI ──────────────────────────────────────────────────────────
-- Langkah manual yang MASIH HARUS Anda lakukan di Supabase Dashboard:
--   1. Storage → bucket "signatures" → upload 3 file:
--      zaini.png, isyana.png, fajar.png (nama file harus PERSIS ini,
--      lihat RA_SIGNATURE_FILE_MAP di shared.js kalau mau ganti nama).
--   2. Cek Authentication → Users: pastikan 6 akun baru muncul
--      (user1@pmunit7.local, dst).
