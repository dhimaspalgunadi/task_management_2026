"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, Timer, CheckCircle2 } from "lucide-react";
import { StatusBadge, PriorityBadge, SlaBadge, CAMPUS_COLORS } from "@/components/badges";
import { slaStatus, STATUS_VALID, type TaskRecord } from "@/lib/taskUtils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const KAMPUS_LIST = ["KL", "GS1", "GS2", "GK", "ICON"];

type TaskApi = {
  id: string;
  idTugas: string;
  kategori: string;
  prioritas: string;
  deskripsi: string;
  pelapor: string;
  status: string;
  jamInput: string;
  jamMulaiProses: string | null;
  jamPenyelesaian: string | null;
  noSuratPenugasan: string | null;
  campus: { code: string; name: string };
  assignedStaff: { name: string } | null;
};

type SummaryApi = {
  total: number;
  perStatus: Record<string, number>;
  perKampus: { kampus: string; total: number; selesai: number; overdue: number }[];
  overdue: number;
};

export default function Dashboard() {
  const { data: session } = useSession();
  const isCentral = session?.user?.role === "KEPALA_IT_PUSAT";
  const [kampusFilter, setKampusFilter] = useState<string>(session?.user?.campusCode ?? "");

  const summaryQS = "";
  const { data: summary } = useSWR<SummaryApi>(`/api/dashboard/summary${summaryQS}`, fetcher, {
    refreshInterval: 15000,
  });

  const taskQS = kampusFilter && isCentral ? `?kampus=${kampusFilter}` : "";
  const { data: taskData } = useSWR<{ tasks: TaskApi[] }>(`/api/tasks${taskQS}`, fetcher, {
    refreshInterval: 15000,
  });

  const tasks = taskData?.tasks ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Dashboard Monitoring Tugas</h1>
        <p className="text-sm text-gray-500">
          Alur kerja: Input &rarr; Proses &rarr; Output &rarr; Evaluasi &rarr; Tindak Lanjut &rarr; Penyelesaian
        </p>
      </div>

      {isCentral && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setKampusFilter("")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm transition ${
              kampusFilter === ""
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-purple-50"
            }`}
          >
            Semua Kampus
          </button>
          {KAMPUS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setKampusFilter(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm transition ${
                kampusFilter === k
                  ? `bg-gradient-to-r ${CAMPUS_COLORS[k]} text-white`
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-purple-50"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total Tugas"
          value={summary?.total ?? "…"}
          color="from-purple-500 to-fuchsia-500"
        />
        <StatCard
          icon={<Timer size={20} />}
          label="Sedang Berjalan"
          value={
            summary
              ? summary.total - (summary.perStatus["Selesai"] ?? 0)
              : "…"
          }
          color="from-blue-500 to-cyan-400"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Selesai"
          value={summary?.perStatus["Selesai"] ?? "…"}
          color="from-green-500 to-emerald-400"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Overdue SLA"
          value={summary?.overdue ?? "…"}
          color="from-orange-500 to-red-500"
        />
      </div>

      {isCentral && summary && summary.perKampus.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {KAMPUS_LIST.map((k) => {
            const entry = summary.perKampus.find((e) => e.kampus === k);
            return (
              <div
                key={k}
                className={`rounded-2xl bg-gradient-to-br ${CAMPUS_COLORS[k]} p-4 text-white shadow-md card-pop`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{k}</p>
                <p className="text-2xl font-extrabold">{entry?.total ?? 0}</p>
                <p className="text-[11px] opacity-90">
                  {entry?.selesai ?? 0} selesai · {entry?.overdue ?? 0} overdue
                </p>
              </div>
            );
          })}
        </div>
      )}

      <KanbanBoard tasks={tasks} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-md backdrop-blur-sm card-pop">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function KanbanBoard({ tasks }: { tasks: TaskApi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STATUS_VALUES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex flex-col rounded-2xl bg-white/60 p-3 shadow-inner">
            <div className="mb-2 flex items-center justify-between px-1">
              <StatusBadge value={status} />
              <span className="text-xs font-semibold text-gray-400">{columnTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400">
                  Tidak ada tugas
                </p>
              )}
              {columnTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_VALUES = STATUS_VALID as unknown as string[];

function TaskCard({ task }: { task: TaskApi }) {
  const record: TaskRecord = {
    prioritas: task.prioritas,
    jamInput: task.jamInput,
    jamMulaiProses: task.jamMulaiProses,
    jamPenyelesaian: task.jamPenyelesaian,
    noSuratPenugasan: task.noSuratPenugasan,
  };
  const sla = slaStatus(record);
  const relevantSla = task.jamPenyelesaian ? sla.penyelesaian : sla.respons;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border border-white bg-white p-3 shadow-sm transition card-pop hover:border-purple-200"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-purple-600">{task.idTugas}</span>
        <span
          className={`rounded-full bg-gradient-to-br ${CAMPUS_COLORS[task.campus.code]} px-2 py-0.5 text-[10px] font-bold text-white`}
        >
          {task.campus.code}
        </span>
      </div>
      <p className="mb-2 line-clamp-2 text-sm font-medium text-gray-800">{task.deskripsi}</p>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge value={task.prioritas} />
        <SlaBadge label={relevantSla} />
      </div>
      <p className="truncate text-[11px] text-gray-400">
        {task.assignedStaff?.name ?? "Belum ditugaskan"} · {task.kategori}
      </p>
    </Link>
  );
}
