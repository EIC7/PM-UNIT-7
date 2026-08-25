-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 002: Amankan pm_seed_account() + siapkan buat fitur
-- "Kelola Akun" di device-admin.html
--
-- MASALAH YANG DIPERBAIKI:
-- pm_seed_account() dibuat SECURITY DEFINER di migration 001, tapi TIDAK
-- ADA pembatasan siapa yang boleh manggil. Supabase/PostgREST otomatis
-- meng-expose SEMUA fungsi di schema public sebagai endpoint REST
-- (/rest/v1/rpc/pm_seed_account) KECUALI sengaja di-REVOKE. Akibatnya,
-- SIAPA PUN yang tau nama fungsi ini (kelihatan di kode GitHub yang
-- publik) bisa bikin akun ADMIN untuk dirinya sendiri, tanpa login sama
-- sekali -- lubang keamanan serius.
--
-- FIX: REVOKE akses publik, lalu tambah pengecekan role ADMIN di dalam
-- fungsinya sendiri. Pengecekan ini otomatis "netral" kalau dijalankan
-- dari SQL Editor (auth.uid() kosong di situ, dianggap konteks
-- owner/trusted) -- jadi baris `select pm_seed_account(...)` di paling
-- bawah migration 001 tetap bisa dipakai seperti biasa dari SQL Editor.
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard ->
-- SQL Editor -> Run. Jalankan SETELAH migration 001.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function pm_seed_account(
  p_username text, p_password text, p_role text, p_display_name text
) returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_uid uuid;
  v_email text := p_username || '@pmunit7.local';
begin
  -- Pengecekan admin: HANYA diblokir kalau dipanggil lewat koneksi yang
  -- SUDAH login (auth.uid() ada isinya) TAPI rolenya BUKAN admin. Kalau
  -- dipanggil dari SQL Editor (auth.uid() = NULL, tidak ada sesi login
  -- PostgREST sama sekali), pengecekan ini dilewati -- supaya SQL Editor
  -- (yang aksesnya sudah dijaga login Supabase Dashboard sendiri) tetap
  -- bisa dipakai normal tanpa perlu login pm_profiles segala.
  if auth.uid() is not null and pm_current_role() is distinct from 'admin' then
    raise exception 'Hanya admin yang boleh membuat/mengubah akun';
  end if;

  if p_role not in ('user','checker','reviewer','admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;
  if length(p_username) < 3 then
    raise exception 'Username minimal 3 karakter';
  end if;
  if length(p_password) < 6 then
    raise exception 'Password minimal 6 karakter';
  end if;

  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    v_uid := gen_random_uuid();
    -- Kolom token diisi '' (bukan NULL) -- lihat migration 001 untuk
    -- penjelasan lengkap kenapa ini wajib (kalau NULL, login gagal 500).
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

-- Tutup akses publik dulu (default Postgres: semua fungsi bisa dipanggil
-- PUBLIC kecuali di-revoke eksplisit), baru buka lagi HANYA untuk
-- 'authenticated' (harus sudah login -- pengecekan role admin di ATAS
-- yang menentukan boleh/tidaknya lebih lanjut). 'anon' (belum login sama
-- sekali) TIDAK diberi akses -- jadi orang luar yang belum login pasti
-- ditolak duluan di level Postgres, sebelum sempat masuk ke fungsinya.
revoke execute on function pm_seed_account(text, text, text, text) from public;
grant execute on function pm_seed_account(text, text, text, text) to authenticated;

-- ── SELESAI ──────────────────────────────────────────────────────────
-- Setelah ini dijalankan:
--   - SQL Editor: pm_seed_account(...) masih bisa dipakai manual seperti
--     biasa (auth.uid() kosong di situ -> lewat pengecekan admin)
--   - Dari aplikasi (RPC): HANYA akun yang sudah login DAN rolenya admin
--     yang bisa manggil ini -- cocok untuk fitur "Kelola Akun" baru di
--     device-admin.html
--   - Orang luar yang belum login: ditolak Postgres duluan (403), tidak
--     bisa bikin akun apa pun
