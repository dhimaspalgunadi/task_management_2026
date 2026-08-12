/**
 * taskUtils.ts — Utilitas inti Sistem Manajemen Tugas Unit IT (5 Kampus).
 *
 * Port 1:1 dari scripts/task_utils.py pada skill `it-task-management-sekolah`.
 * Ini SATU SUMBER KEBENARAN untuk kebijakan jam kerja & tabel SLA di seluruh
 * aplikasi — jangan hardcode ulang angka SLA atau jam kerja di file lain.
 *
 * Semua datetime dikerjakan sebagai objek `Date` (selalu diperlakukan sebagai
 * waktu lokal sekolah). Saat disimpan/API, gunakan string ISO 8601.
 */

export type ClockTime = { h: number; m: number };
export type WorkWindow = { start: ClockTime; end: ClockTime };

// JS Date.getDay(): Minggu=0 ... Sabtu=6. Kita index ulang ke Senin=0..Minggu=6
// supaya sejajar dengan definisi asli (Python weekday()) di skill.
function jsWeekdayToMonFirst(jsDay: number): number {
  return (jsDay + 6) % 7; // Minggu(0)->6, Senin(1)->0, ... Sabtu(6)->5
}

// ---------------------------------------------------------------------------
// 1. KEBIJAKAN JAM KERJA
// ---------------------------------------------------------------------------
// Index: Senin=0 ... Minggu=6
export const WORK_WINDOWS: Record<number, WorkWindow[]> = {
  0: [{ start: { h: 7, m: 15 }, end: { h: 16, m: 15 } }], // Senin
  1: [{ start: { h: 7, m: 15 }, end: { h: 16, m: 15 } }], // Selasa
  2: [{ start: { h: 7, m: 15 }, end: { h: 16, m: 15 } }], // Rabu
  3: [{ start: { h: 7, m: 15 }, end: { h: 16, m: 15 } }], // Kamis
  4: [{ start: { h: 7, m: 15 }, end: { h: 16, m: 15 } }], // Jumat
  5: [{ start: { h: 7, m: 15 }, end: { h: 13, m: 15 } }], // Sabtu — HANYA berlaku jika ada surat penugasan
  6: [], // Minggu — belum ada jendela default, isi manual jika sekolah menetapkan
};

export const PRIORITAS_SLA: Record<string, { responsMenit: number; selesaiMenit: number }> = {
  Urgent: { responsMenit: 30, selesaiMenit: 4 * 60 },
  Tinggi: { responsMenit: 60, selesaiMenit: 1 * 8 * 60 },
  Sedang: { responsMenit: 4 * 60, selesaiMenit: 3 * 8 * 60 },
  Rendah: { responsMenit: 8 * 60, selesaiMenit: 7 * 8 * 60 },
};

export const KATEGORI_VALID = [
  "Hardware",
  "Software",
  "Jaringan",
  "CCTV",
  "Proyektor/AV",
  "Akun/Akses",
  "Lainnya",
] as const;

export const KAMPUS_VALID = ["KL", "GS1", "GS2", "GK", "ICON"] as const;

export const STATUS_VALID = [
  "Baru",
  "Diproses",
  "Menunggu Verifikasi",
  "Tindak Lanjut",
  "Selesai",
] as const;

// Urutan tahap wajib — dipakai untuk menegakkan alur berurutan di API.
export const STAGE_ORDER: readonly string[] = STATUS_VALID;

export type Kategori = (typeof KATEGORI_VALID)[number];
export type Kampus = (typeof KAMPUS_VALID)[number];
export type Status = (typeof STATUS_VALID)[number];
export type Prioritas = keyof typeof PRIORITAS_SLA;

export interface TaskRecord {
  idTugas?: string;
  kampus?: string;
  kategori?: string;
  prioritas?: string;
  deskripsi?: string;
  pelapor?: string;
  stafItDitugaskan?: string | null;
  jamInput?: string | null; // ISO 8601
  jamMulaiProses?: string | null;
  jamOutput?: string | null;
  hasilEvaluasi?: string | null;
  catatanTindakLanjut?: string | null;
  jamPenyelesaian?: string | null;
  status?: string | null;
  noSuratPenugasan?: string | null;
}

// ---------------------------------------------------------------------------
// 2. JAM KERJA
// ---------------------------------------------------------------------------
function timeToMinutes(t: ClockTime): number {
  return t.h * 60 + t.m;
}

function clockMinutesOfDay(dt: Date): number {
  return dt.getHours() * 60 + dt.getMinutes();
}

/** True jika dt berada dalam jendela jam kerja REGULER (Senin-Jumat 07.15-16.15). */
export function isWithinWorkHours(dt: Date): boolean {
  const weekday = jsWeekdayToMonFirst(dt.getDay());
  if (weekday >= 5) return false;
  const mins = clockMinutesOfDay(dt);
  return (WORK_WINDOWS[weekday] ?? []).some(
    (w) => mins >= timeToMinutes(w.start) && mins <= timeToMinutes(w.end)
  );
}

/**
 * True jika dt berada dalam jendela jam lembur akhir pekan yang ditentukan
 * (Sabtu 07.15-13.15). Minggu belum punya jendela default — sesuaikan
 * WORK_WINDOWS[6] jika sekolah menetapkannya.
 */
export function isWithinAuthorizedWeekendHours(dt: Date): boolean {
  const weekday = jsWeekdayToMonFirst(dt.getDay());
  const mins = clockMinutesOfDay(dt);
  return (WORK_WINDOWS[weekday] ?? []).some(
    (w) => mins >= timeToMinutes(w.start) && mins <= timeToMinutes(w.end)
  );
}

function atTime(date: Date, t: ClockTime): Date {
  const d = new Date(date);
  d.setHours(t.h, t.m, 0, 0);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Hitung total menit kerja efektif antara dua Date — hanya menghitung waktu
 * yang jatuh di dalam jendela WORK_WINDOWS.
 *
 * includeWeekend=true dipakai kalau tugas ini punya surat penugasan (boleh
 * hitung jam Sabtu/Minggu sesuai jendela yang didefinisikan di WORK_WINDOWS).
 */
export function businessMinutesBetween(
  startDt: Date,
  endDt: Date,
  includeWeekend = false
): number {
  if (endDt <= startDt) return 0;

  let total = 0;
  let cursorDate = startOfDay(startDt);
  const endDate = startOfDay(endDt);
  const startDateOnly = startOfDay(startDt);

  while (cursorDate <= endDate) {
    const weekday = jsWeekdayToMonFirst(cursorDate.getDay());
    let windows = WORK_WINDOWS[weekday] ?? [];
    if (weekday >= 5 && !includeWeekend) {
      windows = [];
    }

    for (const w of windows) {
      const winStart = atTime(cursorDate, w.start);
      const winEnd = atTime(cursorDate, w.end);
      const segStart = cursorDate.getTime() === startDateOnly.getTime() ? (winStart > startDt ? winStart : startDt) : winStart;
      const segEnd = cursorDate.getTime() === endDate.getTime() ? (winEnd < endDt ? winEnd : endDt) : winEnd;
      if (segStart < segEnd) {
        total += Math.floor((segEnd.getTime() - segStart.getTime()) / 60000);
      }
    }

    cursorDate = addDays(cursorDate, 1);
  }

  return total;
}

// ---------------------------------------------------------------------------
// 3. ID TUGAS
// ---------------------------------------------------------------------------
/** Format: [KODE-KAMPUS]-[YYYYMM]-[NNN], mis. GS1-202608-014. */
export function generateTaskId(kampusCode: string, period: Date, urut: number): string {
  if (!(KAMPUS_VALID as readonly string[]).includes(kampusCode)) {
    throw new Error(`Kode kampus tidak dikenal: ${kampusCode}. Pilihan: ${KAMPUS_VALID.join(", ")}`);
  }
  if (urut < 1) {
    throw new Error("Nomor urut harus >= 1");
  }
  const yyyymm = `${period.getFullYear()}${String(period.getMonth() + 1).padStart(2, "0")}`;
  return `${kampusCode}-${yyyymm}-${String(urut).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// 4. VALIDASI RECORD TUGAS
// ---------------------------------------------------------------------------
/**
 * Validasi satu record tugas terhadap skema & kebijakan jam kerja.
 * Return: array pesan error (array kosong = valid).
 *
 * Field wajib minimum: kampus, kategori, prioritas, jamInput (string ISO 8601).
 * noSuratPenugasan wajib diisi kalau jamInput di luar jam kerja reguler.
 */
export function validateTask(task: TaskRecord): string[] {
  const errors: string[] = [];

  if (!task.kampus || !(KAMPUS_VALID as readonly string[]).includes(task.kampus)) {
    errors.push(`Kampus tidak valid: ${task.kampus}. Pilihan: ${KAMPUS_VALID.join(", ")}`);
  }

  if (!task.kategori || !(KATEGORI_VALID as readonly string[]).includes(task.kategori)) {
    errors.push(`Kategori tidak valid: ${task.kategori}. Pilihan: ${KATEGORI_VALID.join(", ")}`);
  }

  if (!task.prioritas || !(task.prioritas in PRIORITAS_SLA)) {
    errors.push(`Prioritas tidak valid: ${task.prioritas}. Pilihan: ${Object.keys(PRIORITAS_SLA).join(", ")}`);
  }

  const jamInputRaw = task.jamInput;
  if (!jamInputRaw) {
    errors.push("jamInput wajib diisi");
  } else {
    const jamInput = new Date(jamInputRaw);
    if (isNaN(jamInput.getTime())) {
      errors.push(`Format jamInput tidak valid, gunakan ISO 8601: ${jamInputRaw}`);
    } else if (!isWithinWorkHours(jamInput)) {
      if (!task.noSuratPenugasan) {
        errors.push(
          "jamInput di luar jam kerja reguler (Senin-Jumat 07.15-16.15) tapi 'noSuratPenugasan' belum diisi."
        );
      } else if (jsWeekdayToMonFirst(jamInput.getDay()) >= 5 && !isWithinAuthorizedWeekendHours(jamInput)) {
        errors.push(
          "jamInput di akhir pekan berada di luar jendela lembur yang ditentukan (Sabtu 07.15-13.15) — " +
            "cek kembali jam kerja lembur yang berlaku, atau tambahkan jendela hari Minggu di WORK_WINDOWS kalau memang berlaku."
        );
      }
    }
  }

  if (task.status != null && !(STATUS_VALID as readonly string[]).includes(task.status)) {
    errors.push(`Status tidak valid: ${task.status}. Pilihan: ${STATUS_VALID.join(", ")}`);
  }

  if (task.hasilEvaluasi === "Perlu Perbaikan" && !task.catatanTindakLanjut) {
    errors.push("hasilEvaluasi = 'Perlu Perbaikan' tapi catatanTindakLanjut belum diisi");
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 5. STATUS SLA
// ---------------------------------------------------------------------------
export type SlaLabel =
  | "On Time"
  | "Overdue"
  | "On Time (masih berjalan)"
  | "Overdue (masih berjalan)"
  | "On Time (masih menunggu)"
  | "Overdue (masih menunggu)"
  | "Belum Ada Data"
  | "Prioritas tidak dikenal";

export interface SlaStatusResult {
  respons: SlaLabel;
  penyelesaian: SlaLabel;
}

/**
 * Hitung status SLA satu tugas berdasarkan prioritas & timestamp yang tersedia.
 * Field opsional yang dibaca: jamInput, jamMulaiProses, jamPenyelesaian (ISO 8601).
 */
export function slaStatus(task: TaskRecord): SlaStatusResult {
  const prioritas = task.prioritas;
  if (!prioritas || !(prioritas in PRIORITAS_SLA)) {
    return { respons: "Prioritas tidak dikenal", penyelesaian: "Prioritas tidak dikenal" };
  }

  const target = PRIORITAS_SLA[prioritas];
  const includeWeekend = Boolean(task.noSuratPenugasan);

  const parse = (raw?: string | null) => (raw ? new Date(raw) : null);

  const jamInput = parse(task.jamInput);
  const jamMulaiProses = parse(task.jamMulaiProses);
  const jamPenyelesaian = parse(task.jamPenyelesaian);

  const result: SlaStatusResult = { respons: "Belum Ada Data", penyelesaian: "Belum Ada Data" };
  if (!jamInput) return result;

  const now = new Date();

  if (jamMulaiProses) {
    const menit = businessMinutesBetween(jamInput, jamMulaiProses, includeWeekend);
    result.respons = menit <= target.responsMenit ? "On Time" : "Overdue";
  } else {
    const menit = businessMinutesBetween(jamInput, now, includeWeekend);
    result.respons = menit <= target.responsMenit ? "On Time (masih menunggu)" : "Overdue (masih menunggu)";
  }

  if (jamPenyelesaian) {
    const menit = businessMinutesBetween(jamInput, jamPenyelesaian, includeWeekend);
    result.penyelesaian = menit <= target.selesaiMenit ? "On Time" : "Overdue";
  } else {
    const menit = businessMinutesBetween(jamInput, now, includeWeekend);
    result.penyelesaian = menit <= target.selesaiMenit ? "On Time (masih berjalan)" : "Overdue (masih berjalan)";
  }

  return result;
}
