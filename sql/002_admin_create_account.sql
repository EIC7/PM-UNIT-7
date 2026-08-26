-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION 002: RPC aman untuk bikin akun laporan dari UI (device-admin.html)
--
-- CARA PAKAI: copy-paste SELURUH file ini ke Supabase Dashboard →
-- SQL Editor → Run (setelah 001_report_auth_workflow.sql).
--
-- KENAPA MIGRATION INI DIBUTUHKAN:
-- pm_seed_account() (dari 001) itu SECURITY DEFINER tapi TIDAK ADA
-- pengecekan role sama sekali di dalamnya -- awalnya memang cuma
-- dimaksudkan dijalankan manual oleh project owner lewat SQL Editor.
-- Begitu device-admin.html mau memanggilnya lewat client (RPC) supaya
-- admin bisa tambah akun dari UI, itu jadi lubang keamanan: SIAPA SAJA
-- yang berhasil login (termasuk role 'user' biasa) bisa buka console
-- browser dan manggil rpc('pm_seed_account', {...role:'admin'...}) untuk
-- bikin akun admin baru buat dirinya sendiri.
--
-- Migration ini menambah WRAPPER baru (pm_admin_create_account) yang
-- CEK role='admin' dulu sebelum melakukan apa pun, lalu revoke akses RPC
-- langsung ke pm_seed_account dari role 'authenticated' (tetap bisa
-- dipanggil manual dari SQL Editor sebagai project owner, seperti biasa).
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Wrapper aman: cuma admin yang bisa jalankan ─────────────────────
create or replace function pm_admin_create_account(
  p_username text, p_password text, p_role text, p_display_name text
) returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if pm_current_role() <> 'admin' then
    raise exception 'Akses ditolak: hanya akun role admin yang boleh membuat akun baru.';
  end if;
  if p_role not in ('user','checker','reviewer','admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;
  perform pm_seed_account(p_username, p_password, p_role, p_display_name);
end;
$$;

-- ── 2. Kunci akses langsung ke pm_seed_account dari client ─────────────
-- Postgres default GRANT EXECUTE ON FUNCTION ke PUBLIC saat function
-- dibuat -- revoke itu supaya pm_seed_account (TANPA pengecekan role)
-- cuma bisa dipanggil manual dari SQL Editor (sebagai project owner),
-- TIDAK BISA dipanggil lewat RPC dari browser oleh siapa pun.
revoke execute on function pm_seed_account(text, text, text, text) from public, anon, authenticated;

-- pm_admin_create_account BOLEH dipanggil siapa saja yang sudah login
-- (authenticated) -- pengecekan role admin ada DI DALAM function-nya
-- sendiri (lihat di atas), jadi aman walau EXECUTE terbuka untuk semua
-- authenticated user.
grant execute on function pm_admin_create_account(text, text, text, text) to authenticated;
revoke execute on function pm_admin_create_account(text, text, text, text) from anon, public;

-- ── SELESAI ──────────────────────────────────────────────────────────
-- Setelah ini, device-admin.html bisa manggil dari client:
--   client.rpc('pm_admin_create_account', {
--     p_username: 'checker3', p_password: '...', p_role: 'checker', p_display_name: 'Nama Checker 3'
--   })
-- dan akan otomatis ditolak Postgres kalau yang manggil bukan akun admin.
