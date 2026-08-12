"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KATEGORI_VALID, PRIORITAS_SLA } from "@/lib/taskUtils";
import { Send } from "lucide-react";

type Campus = { id: string; code: string; name: string };
type Staff = { id: string; name: string; role: string };

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewTaskForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const isCentral = session?.user?.role === "KEPALA_IT_PUSAT";

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [campusId, setCampusId] = useState("");
  const [kategori, setKategori] = useState<string>(KATEGORI_VALID[0]);
  const [prioritas, setPrioritas] = useState<string>("Sedang");
  const [deskripsi, setDeskripsi] = useState("");
  const [pelapor, setPelapor] = useState("");
  const [jamInput, setJamInput] = useState(() => toLocalInputValue(new Date()));
  const [noSuratPenugasan, setNoSuratPenugasan] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/campuses")
      .then((r) => r.json())
      .then((d) => {
        setCampuses(d.campuses ?? []);
        if (!isCentral && session?.user?.campusCode) {
          const own = (d.campuses ?? []).find((c: Campus) => c.code === session.user.campusCode);
          if (own) setCampusId(own.id);
        }
      });
  }, [isCentral, session?.user?.campusCode]);

  useEffect(() => {
    const qs = isCentral && campusId ? `?kampus=${campuses.find((c) => c.id === campusId)?.code ?? ""}` : "";
    fetch(`/api/staff${qs}`)
      .then((r) => r.json())
      .then((d) => setStaffList(d.staff ?? []));
  }, [campusId, campuses, isCentral]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campusId,
          kategori,
          prioritas,
          deskripsi,
          pelapor,
          jamInput: new Date(jamInput).toISOString(),
          noSuratPenugasan: noSuratPenugasan || undefined,
          assignedStaffId: assignedStaffId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat tugas");
        return;
      }
      router.push(`/tasks/${data.task.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white bg-white/85 p-6 shadow-xl backdrop-blur-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Kampus</label>
          <select
            required
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            disabled={!isCentral}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2 disabled:bg-gray-50"
          >
            <option value="">Pilih kampus</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
          >
            {KATEGORI_VALID.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Prioritas</label>
          <select
            value={prioritas}
            onChange={(e) => setPrioritas(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
          >
            {Object.keys(PRIORITAS_SLA).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Waktu Input</label>
          <input
            type="datetime-local"
            required
            value={jamInput}
            onChange={(e) => setJamInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Pelapor</label>
          <input
            required
            value={pelapor}
            onChange={(e) => setPelapor(e.target.value)}
            placeholder="Nama & unit pelapor"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Tugaskan ke Staf (opsional)</label>
          <select
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
          >
            <option value="">Belum ditugaskan</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Deskripsi</label>
        <textarea
          required
          rows={4}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Jelaskan permintaan/masalah secara singkat"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          No. Surat Penugasan{" "}
          <span className="font-normal text-gray-400">(wajib jika di luar jam kerja reguler Senin-Jumat 07.15-16.15)</span>
        </label>
        <input
          value={noSuratPenugasan}
          onChange={(e) => setNoSuratPenugasan(e.target.value)}
          placeholder="Contoh: ST/012/VIII/2026"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
      >
        <Send size={16} />
        {loading ? "Menyimpan..." : "Buat Tugas"}
      </button>
    </form>
  );
}
