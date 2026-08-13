"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserPlus, Pencil, Trash2, Power, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_LABEL: Record<string, string> = {
  STAF_IT: "Staf IT",
  KOORDINATOR_KAMPUS: "Koordinator Kampus",
  KEPALA_IT_PUSAT: "Kepala IT Pusat",
};

const ROLE_STYLE: Record<string, string> = {
  STAF_IT: "bg-blue-100 text-blue-700",
  KOORDINATOR_KAMPUS: "bg-purple-100 text-purple-700",
  KEPALA_IT_PUSAT: "bg-pink-100 text-pink-700",
};

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  campusId: string | null;
  campusCode: string | null;
};

type Campus = { id: string; code: string; name: string };

export default function UserManagement() {
  const { data: session } = useSession();
  const { data, mutate, isLoading } = useSWR<{ staff: StaffRow[]; error?: string }>("/api/admin/users", fetcher);
  const { data: campusData } = useSWR<{ campuses: Campus[] }>("/api/campuses", fetcher);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(row: StaffRow) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengubah status");
        return;
      }
      await mutate();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(row: StaffRow) {
    if (!confirm(`Hapus akun "${row.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus akun");
        return;
      }
      await mutate();
    } finally {
      setBusyId(null);
    }
  }

  if (data?.error) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{data.error}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isLoading ? "Memuat..." : `${data?.staff.length ?? 0} akun terdaftar`}
        </p>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
        >
          <UserPlus size={16} /> Tambah User
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-3xl border border-white bg-white/85 shadow-xl backdrop-blur-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Peran</th>
              <th className="px-5 py-3">Kampus</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.staff.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/40">
                <td className="px-5 py-3 font-medium text-gray-800">
                  {row.name}
                  {row.id === session?.user?.id && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">Kamu</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-500">{row.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLE[row.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABEL[row.role] ?? row.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{row.campusCode ?? "Pusat"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {row.active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditing(row)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-purple-100 hover:text-purple-600"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(row)}
                      disabled={busyId === row.id || row.id === session?.user?.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-orange-100 hover:text-orange-600 disabled:opacity-30"
                      title={row.active ? "Nonaktifkan" : "Aktifkan"}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => deleteUser(row)}
                      disabled={busyId === row.id || row.id === session?.user?.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-30"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          campuses={campusData?.campuses ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user,
  campuses,
  onClose,
  onSaved,
}: {
  user: StaffRow;
  campuses: Campus[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [campusId, setCampusId] = useState(user.campusId ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          campusId: role === "KEPALA_IT_PUSAT" ? null : campusId,
          ...(newPassword ? { newPassword } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan perubahan");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nama</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Peran</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
            >
              <option value="STAF_IT">Staf IT</option>
              <option value="KOORDINATOR_KAMPUS">Koordinator Kampus</option>
              <option value="KEPALA_IT_PUSAT">Kepala IT Pusat</option>
            </select>
          </div>
          {role !== "KEPALA_IT_PUSAT" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Kampus</label>
              <select
                required
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
              >
                <option value="">Pilih kampus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Reset Password <span className="font-normal text-gray-400">(opsional, kosongkan jika tidak diubah)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}
