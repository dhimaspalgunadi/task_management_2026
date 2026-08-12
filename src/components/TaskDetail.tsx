"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge, SlaBadge, CAMPUS_COLORS } from "@/components/badges";
import { slaStatus } from "@/lib/taskUtils";
import { CheckCircle2, PlayCircle, Send, ShieldCheck, Wrench, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type LogEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
  changedBy: { name: string } | null;
};

type TaskFull = {
  id: string;
  idTugas: string;
  kategori: string;
  prioritas: string;
  deskripsi: string;
  pelapor: string;
  status: string;
  jamInput: string;
  jamMulaiProses: string | null;
  jamOutput: string | null;
  jamPenyelesaian: string | null;
  hasilEvaluasi: string | null;
  catatanTindakLanjut: string | null;
  noSuratPenugasan: string | null;
  campus: { code: string; name: string };
  assignedStaff: { name: string } | null;
  logs: LogEntry[];
};

function fmt(dt: string | null): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function TaskDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, mutate, isLoading } = useSWR<{ task: TaskFull; error?: string }>(`/api/tasks/${id}`, fetcher);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [hasilEvaluasi, setHasilEvaluasi] = useState<"Sesuai" | "Perlu Perbaikan">("Sesuai");

  if (isLoading) return <p className="px-6 py-10 text-gray-500">Memuat...</p>;
  if (!data?.task) return <p className="px-6 py-10 text-red-500">{data?.error ?? "Tugas tidak ditemukan"}</p>;

  const task = data.task;
  const sla = slaStatus({
    prioritas: task.prioritas,
    jamInput: task.jamInput,
    jamMulaiProses: task.jamMulaiProses,
    jamPenyelesaian: task.jamPenyelesaian,
    noSuratPenugasan: task.noSuratPenugasan,
  });

  const canApprove = session?.user?.role === "KOORDINATOR_KAMPUS" || session?.user?.role === "KEPALA_IT_PUSAT";

  async function runAction(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tasks/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Gagal memproses aksi");
        return;
      }
      setCatatan("");
      await mutate();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 rounded-3xl border border-white bg-white/85 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-purple-700">{task.idTugas}</span>
            <span
              className={`rounded-full bg-gradient-to-br ${CAMPUS_COLORS[task.campus.code]} px-2.5 py-0.5 text-[11px] font-bold text-white`}
            >
              {task.campus.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge value={task.status} />
            <PriorityBadge value={task.prioritas} />
          </div>
        </div>

        <h1 className="mb-2 text-xl font-bold text-gray-800">{task.deskripsi}</h1>
        <p className="mb-4 text-sm text-gray-500">
          Kategori: <span className="font-medium text-gray-700">{task.kategori}</span> · Pelapor:{" "}
          <span className="font-medium text-gray-700">{task.pelapor}</span> · PIC:{" "}
          <span className="font-medium text-gray-700">{task.assignedStaff?.name ?? "Belum ditugaskan"}</span>
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TimeStat label="Input" value={fmt(task.jamInput)} />
          <TimeStat label="Mulai Proses" value={fmt(task.jamMulaiProses)} />
          <TimeStat label="Output" value={fmt(task.jamOutput)} />
          <TimeStat label="Selesai" value={fmt(task.jamPenyelesaian)} />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">SLA Respons:</span>
          <SlaBadge label={sla.respons} />
          <span className="ml-3 text-xs font-semibold text-gray-500">SLA Penyelesaian:</span>
          <SlaBadge label={sla.penyelesaian} />
        </div>

        {task.noSuratPenugasan && (
          <p className="mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700">
            Surat Penugasan: {task.noSuratPenugasan}
          </p>
        )}

        {task.catatanTindakLanjut && (
          <p className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <span className="font-semibold">Catatan Tindak Lanjut:</span> {task.catatanTindakLanjut}
          </p>
        )}

        {actionError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{actionError}</p>}

        <div className="flex flex-wrap gap-2">
          {task.status === "Baru" && (
            <ActionButton
              icon={<PlayCircle size={16} />}
              label="Mulai Proses"
              busy={busy}
              onClick={() => runAction("mulai_proses")}
              color="from-purple-600 to-indigo-500"
            />
          )}

          {task.status === "Diproses" && (
            <ActionButton
              icon={<Send size={16} />}
              label="Kirim Output"
              busy={busy}
              onClick={() => runAction("submit_output", { catatanOutput: catatan || undefined })}
              color="from-cyan-500 to-blue-500"
            />
          )}

          {task.status === "Menunggu Verifikasi" && task.hasilEvaluasi !== "Sesuai" && (
            <div className="w-full space-y-2 rounded-2xl bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-700">Tahap Evaluasi</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasilEvaluasi("Sesuai")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${hasilEvaluasi === "Sesuai" ? "bg-green-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
                >
                  Sesuai
                </button>
                <button
                  type="button"
                  onClick={() => setHasilEvaluasi("Perlu Perbaikan")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${hasilEvaluasi === "Perlu Perbaikan" ? "bg-orange-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
                >
                  Perlu Perbaikan
                </button>
              </div>
              {hasilEvaluasi === "Perlu Perbaikan" && (
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan tindak lanjut (wajib)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
                  rows={2}
                />
              )}
              <ActionButton
                icon={<ShieldCheck size={16} />}
                label="Simpan Hasil Evaluasi"
                busy={busy}
                onClick={() => runAction("evaluasi", { hasilEvaluasi, catatanTindakLanjut: catatan || undefined })}
                color="from-purple-600 to-pink-500"
              />
            </div>
          )}

          {task.status === "Menunggu Verifikasi" && task.hasilEvaluasi === "Sesuai" && canApprove && (
            <ActionButton
              icon={<CheckCircle2 size={16} />}
              label="Setujui & Selesaikan Tugas"
              busy={busy}
              onClick={() => runAction("selesaikan")}
              color="from-green-500 to-emerald-500"
            />
          )}

          {task.status === "Menunggu Verifikasi" && task.hasilEvaluasi === "Sesuai" && !canApprove && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Hasil evaluasi: Sesuai — menunggu persetujuan penyelesaian dari Koordinator Kampus.
            </p>
          )}

          {task.status === "Tindak Lanjut" && (
            <div className="w-full space-y-2">
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan penyelesaian tindak lanjut (opsional)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-purple-300 focus:ring-2"
                rows={2}
              />
              <ActionButton
                icon={<Wrench size={16} />}
                label="Tindak Lanjut Selesai — Kirim Ulang untuk Evaluasi"
                busy={busy}
                onClick={() => runAction("tindak_lanjut_selesai", { catatan: catatan || undefined })}
                color="from-orange-500 to-amber-500"
              />
            </div>
          )}

          {task.status === "Selesai" && (
            <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              <CheckCircle2 size={16} /> Tugas telah selesai & disetujui.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white bg-white/85 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
          <Clock size={16} /> Riwayat Alur Kerja
        </h2>
        <ol className="space-y-3 border-l-2 border-purple-200 pl-4">
          {task.logs.map((log) => (
            <li key={log.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <p className="text-sm font-semibold text-gray-800">
                {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : `Dibuat: ${log.toStatus}`}
              </p>
              {log.note && <p className="text-xs text-gray-500">{log.note}</p>}
              <p className="text-[11px] text-gray-400">
                {fmt(log.createdAt)} · {log.changedBy?.name ?? "Sistem"}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function TimeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-xs font-medium text-gray-700">{value}</p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  busy,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy: boolean;
  color: string;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${color} px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60`}
    >
      {icon}
      {busy ? "Memproses..." : label}
    </button>
  );
}
