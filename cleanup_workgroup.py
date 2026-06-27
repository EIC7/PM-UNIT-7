"""
Hapus history pengambilan (material_pengambilan) dari work group
selain: MNT-E7, MNT-E8, MNT-C7, MNT-C8

Jalankan:  python3 cleanup_workgroup.py
"""

import json, urllib.request, urllib.error

SUPA_URL    = "https://ruvvximnnacpvvoogbzs.supabase.co"
SUPA_KEY    = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
               ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dnZ4aW1ubmFjcHZ2b29nYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE1NDAsImV4cCI6MjA5NDYxNzU0MH0"
               ".GRu5n0Jl2fP0V8L_QLN2Tkmd0Aw0JbMRu25I7t-R7l8")
AMBIL_TABLE = "material_pengambilan"

KEEP_GROUPS = ["MNT-E7", "MNT-E8", "MNT-C7", "MNT-C8"]

def supa_request(method, path, body=None):
    url = f"{SUPA_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body else None
    headers = {
        "apikey":        SUPA_KEY,
        "Authorization": f"Bearer {SUPA_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "count=exact,return=minimal",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            count_range = r.headers.get("Content-Range", "")
            resp = r.read()
            body_out = json.loads(resp) if resp else []
            return body_out, count_range
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise RuntimeError(f"HTTP {e.code}: {err[:400]}")

def main():
    print("=" * 60)
    print("CLEANUP — hapus history work group bukan MNT-E7/E8/C7/C8")
    print("=" * 60)

    # Cek distribusi work group yang ada
    print("\nMengecek distribusi work group di database...")
    keep_param = ",".join(KEEP_GROUPS)  # MNT-E7,MNT-E8,MNT-C7,MNT-C8

    # Count records yang akan DIHAPUS (not in keep list)
    path_count = (
        f"{AMBIL_TABLE}"
        f"?select=pengambil"
        f"&pengambil=not.in.({keep_param})"
        f"&limit=1"
    )
    _, cr = supa_request("GET", path_count)
    m = __import__('re').search(r'/(\d+)$', cr)
    total_to_delete = int(m.group(1)) if m else 0

    # Count records yang akan DIPERTAHANKAN
    path_keep = (
        f"{AMBIL_TABLE}"
        f"?select=pengambil"
        f"&pengambil=in.({keep_param})"
        f"&limit=1"
    )
    _, cr2 = supa_request("GET", path_keep)
    m2 = __import__('re').search(r'/(\d+)$', cr2)
    total_to_keep = int(m2.group(1)) if m2 else 0

    # Count null pengambil
    path_null = f"{AMBIL_TABLE}?select=pengambil&pengambil=is.null&limit=1"
    _, cr3 = supa_request("GET", path_null)
    m3 = __import__('re').search(r'/(\d+)$', cr3)
    total_null = int(m3.group(1)) if m3 else 0

    print(f"\n  Akan DIPERTAHANKAN  : {total_to_keep:>8,} records (MNT-E7/E8/C7/C8)")
    print(f"  Pengambil NULL      : {total_null:>8,} records")
    print(f"  Akan DIHAPUS        : {total_to_delete:>8,} records (work group lain)")
    print()

    if total_to_delete == 0:
        print("✅ Tidak ada record yang perlu dihapus.")
        return

    ans = input(f"  Lanjutkan hapus {total_to_delete:,} records? (ketik 'ya' untuk konfirmasi): ").strip()
    if ans.lower() != 'ya':
        print("  Dibatalkan.")
        return

    # Hapus via DELETE filter
    print(f"\nMenghapus {total_to_delete:,} records...")
    delete_path = (
        f"{AMBIL_TABLE}"
        f"?pengambil=not.in.({keep_param})"
    )
    _, _ = supa_request("DELETE", delete_path)

    print("✅ Selesai! Records work group lain sudah dihapus.")
    print("\nSisa records (estimasi):", total_to_keep, "+ NULL:", total_null)
    print("=" * 60)

if __name__ == "__main__":
    main()
