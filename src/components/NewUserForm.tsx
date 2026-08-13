"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { UserPlus } from "lucide-react";

type Campus = { id: string; code: string; name: string };

export default function NewUserForm() {
  const router = useRouter();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAF_IT");
  const [campusId, setCampusId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/campuses")
      .then((r) => r.json())
      .then((d) => setCampuses(d.campuses ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          campusId: role === "KEPALA_IT_PUSAT" ? null : campusId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat user");
        return;
      }
      await mutate("/api/admin/users");
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white bg-white/85 p-6 shadow-xl backdrop-blur-sm">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Nama</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@spkkatolik.sch.id"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Peran</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
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
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
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
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Password Awal</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
        <p className="mt-1 text-xs text-gray-400">Sampaikan password ini ke staf yang bersangkutan agar bisa login.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
      >
        <UserPlus size={16} />
        {loading ? "Menyimpan..." : "Buat User"}
      </button>
    </form>
  );
}
