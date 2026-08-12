/**
 * workflow.ts — Implementasi alur 6 tahap Sistem Manajemen Tugas Unit IT:
 * Input -> Proses -> Output -> Evaluasi -> Tindak Lanjut -> Penyelesaian.
 *
 * Status yang tersimpan di DB (lihat taskUtils.STATUS_VALID) hanya 5 nilai —
 * "Evaluasi" bukan status tersendiri, melainkan aksi yang terjadi selagi
 * status = "Menunggu Verifikasi" dan menentukan cabang berikutnya (Selesai
 * atau Tindak Lanjut), sesuai reference/data-schema.md pada skill.
 */
import { prisma } from "@/lib/prisma";
import { validateTask } from "@/lib/taskUtils";
import { canApproveCompletion } from "@/lib/authz";
import type { Task } from "@prisma/client";

export class WorkflowError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function logTransition(
  taskId: string,
  fromStatus: string | null,
  toStatus: string,
  changedById: string,
  note?: string | null
) {
  await prisma.taskLog.create({
    data: { taskId, fromStatus, toStatus, changedById, note: note ?? null },
  });
}

/** Tahap 1 — INPUT: buat tugas baru. */
export async function createTask(input: {
  campusId: string;
  kampusCode: string;
  kategori: string;
  prioritas: string;
  deskripsi: string;
  pelapor: string;
  jamInput: string;
  noSuratPenugasan?: string | null;
  assignedStaffId?: string | null;
  createdById: string;
}): Promise<Task> {
  const errors = validateTask({
    kampus: input.kampusCode,
    kategori: input.kategori,
    prioritas: input.prioritas,
    jamInput: input.jamInput,
    noSuratPenugasan: input.noSuratPenugasan,
  });
  if (errors.length > 0) {
    throw new WorkflowError(errors.join(" | "));
  }
  if (!input.deskripsi?.trim()) throw new WorkflowError("Deskripsi wajib diisi");
  if (!input.pelapor?.trim()) throw new WorkflowError("Pelapor wajib diisi");

  const period = new Date(input.jamInput);
  const periodStart = `${period.getFullYear()}${String(period.getMonth() + 1).padStart(2, "0")}`;

  const count = await prisma.task.count({
    where: {
      campusId: input.campusId,
      idTugas: { startsWith: `${input.kampusCode}-${periodStart}-` },
    },
  });

  const { generateTaskId } = await import("@/lib/taskUtils");
  const idTugas = generateTaskId(input.kampusCode, period, count + 1);

  const task = await prisma.task.create({
    data: {
      idTugas,
      campusId: input.campusId,
      kategori: input.kategori,
      prioritas: input.prioritas,
      deskripsi: input.deskripsi,
      pelapor: input.pelapor,
      jamInput: new Date(input.jamInput),
      noSuratPenugasan: input.noSuratPenugasan || null,
      assignedStaffId: input.assignedStaffId || null,
      status: "Baru",
    },
  });

  await logTransition(task.id, null, "Baru", input.createdById, "Tugas dibuat (Input)");
  return task;
}

async function getTaskOrThrow(taskId: string): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new WorkflowError("Tugas tidak ditemukan", 404);
  return task;
}

/** Tahap 2 — PROSES: staf mulai mengerjakan tugas. */
export async function mulaiProses(taskId: string, staffId: string): Promise<Task> {
  const task = await getTaskOrThrow(taskId);
  if (task.status !== "Baru") {
    throw new WorkflowError(`Tidak bisa mulai proses dari status '${task.status}', harus dari 'Baru'`);
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "Diproses",
      jamMulaiProses: new Date(),
      assignedStaffId: task.assignedStaffId ?? staffId,
    },
  });
  await logTransition(taskId, task.status, "Diproses", staffId, "Staf mulai memproses tugas");
  return updated;
}

/** Tahap 3 — OUTPUT: hasil teknis selesai, tugas menunggu verifikasi/evaluasi. */
export async function submitOutput(taskId: string, staffId: string, catatanOutput?: string): Promise<Task> {
  const task = await getTaskOrThrow(taskId);
  if (task.status !== "Diproses") {
    throw new WorkflowError(`Tidak bisa submit output dari status '${task.status}', harus dari 'Diproses'`);
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: "Menunggu Verifikasi", jamOutput: new Date() },
  });
  await logTransition(taskId, task.status, "Menunggu Verifikasi", staffId, catatanOutput ?? "Output dikirim untuk evaluasi");
  return updated;
}

/**
 * Tahap 4 — EVALUASI: menentukan apakah hasil sesuai atau perlu perbaikan.
 * Jika "Perlu Perbaikan", tugas pindah ke status Tindak Lanjut dan
 * catatanTindakLanjut wajib diisi.
 */
export async function evaluasi(
  taskId: string,
  evaluatorId: string,
  hasilEvaluasi: "Sesuai" | "Perlu Perbaikan",
  catatanTindakLanjut?: string
): Promise<Task> {
  const task = await getTaskOrThrow(taskId);
  if (task.status !== "Menunggu Verifikasi") {
    throw new WorkflowError(`Tidak bisa evaluasi dari status '${task.status}', harus dari 'Menunggu Verifikasi'`);
  }

  const errors = validateTask({
    kampus: undefined,
    kategori: undefined,
    prioritas: undefined,
    jamInput: task.jamInput.toISOString(),
    noSuratPenugasan: task.noSuratPenugasan,
    hasilEvaluasi,
    catatanTindakLanjut,
  });
  const relevantErrors = errors.filter((e) => e.includes("catatanTindakLanjut"));
  if (relevantErrors.length > 0) throw new WorkflowError(relevantErrors.join(" | "));

  if (hasilEvaluasi === "Sesuai") {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { hasilEvaluasi, catatanTindakLanjut: null },
    });
    await logTransition(taskId, task.status, task.status, evaluatorId, "Evaluasi: Sesuai — menunggu persetujuan penyelesaian");
    return updated;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: "Tindak Lanjut", hasilEvaluasi, catatanTindakLanjut },
  });
  await logTransition(taskId, task.status, "Tindak Lanjut", evaluatorId, catatanTindakLanjut);
  return updated;
}

/** Tahap 5 — TINDAK LANJUT: staf menyelesaikan perbaikan, kirim ulang untuk evaluasi. */
export async function selesaikanTindakLanjut(taskId: string, staffId: string, catatan?: string): Promise<Task> {
  const task = await getTaskOrThrow(taskId);
  if (task.status !== "Tindak Lanjut") {
    throw new WorkflowError(`Tidak bisa menyelesaikan tindak lanjut dari status '${task.status}', harus dari 'Tindak Lanjut'`);
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: "Menunggu Verifikasi", hasilEvaluasi: null },
  });
  await logTransition(taskId, task.status, "Menunggu Verifikasi", staffId, catatan ?? "Perbaikan selesai, dikirim ulang untuk evaluasi");
  return updated;
}

/**
 * Tahap 6 — PENYELESAIAN: hanya boleh terjadi jika hasilEvaluasi = 'Sesuai'
 * dan disetujui Koordinator Kampus / Kepala IT Pusat (sesuai aturan approval
 * manual di reference/data-schema.md).
 */
export async function selesaikanTugas(
  taskId: string,
  approverId: string,
  approverRole: string
): Promise<Task> {
  const task = await getTaskOrThrow(taskId);
  if (!canApproveCompletion(approverRole)) {
    throw new WorkflowError("Hanya Koordinator Kampus atau Kepala IT Pusat yang bisa menyetujui penyelesaian tugas", 403);
  }
  if (task.status !== "Menunggu Verifikasi" || task.hasilEvaluasi !== "Sesuai") {
    throw new WorkflowError("Tugas hanya bisa diselesaikan jika status 'Menunggu Verifikasi' dan hasil evaluasi 'Sesuai'");
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: "Selesai", jamPenyelesaian: new Date() },
  });
  await logTransition(taskId, task.status, "Selesai", approverId, "Disetujui dan ditutup");
  return updated;
}
