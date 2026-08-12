import clsx from "clsx";

const PRIORITY_STYLES: Record<string, string> = {
  Urgent: "bg-red-100 text-red-700 border-red-300",
  Tinggi: "bg-orange-100 text-orange-700 border-orange-300",
  Sedang: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Rendah: "bg-green-100 text-green-700 border-green-300",
};

const STATUS_STYLES: Record<string, string> = {
  Baru: "bg-blue-100 text-blue-700 border-blue-300",
  Diproses: "bg-purple-100 text-purple-700 border-purple-300",
  "Menunggu Verifikasi": "bg-cyan-100 text-cyan-700 border-cyan-300",
  "Tindak Lanjut": "bg-orange-100 text-orange-700 border-orange-300",
  Selesai: "bg-green-100 text-green-700 border-green-300",
};

const SLA_STYLES: Record<string, string> = {
  "On Time": "bg-green-100 text-green-700",
  "On Time (masih berjalan)": "bg-green-50 text-green-600",
  "On Time (masih menunggu)": "bg-green-50 text-green-600",
  Overdue: "bg-red-100 text-red-700",
  "Overdue (masih berjalan)": "bg-red-50 text-red-600",
  "Overdue (masih menunggu)": "bg-red-50 text-red-600",
  "Belum Ada Data": "bg-gray-100 text-gray-500",
  "Prioritas tidak dikenal": "bg-gray-100 text-gray-500",
};

export function PriorityBadge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        PRIORITY_STYLES[value] ?? "bg-gray-100 text-gray-600 border-gray-300"
      )}
    >
      {value}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[value] ?? "bg-gray-100 text-gray-600 border-gray-300"
      )}
    >
      {value}
    </span>
  );
}

export function SlaBadge({ label }: { label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        SLA_STYLES[label] ?? "bg-gray-100 text-gray-500"
      )}
    >
      {label}
    </span>
  );
}

export const CAMPUS_COLORS: Record<string, string> = {
  KL: "from-purple-500 to-fuchsia-500",
  GS1: "from-blue-500 to-cyan-400",
  GS2: "from-orange-500 to-amber-400",
  GK: "from-green-500 to-emerald-400",
  ICON: "from-pink-500 to-rose-400",
};
