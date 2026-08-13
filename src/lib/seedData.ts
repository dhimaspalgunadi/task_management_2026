/**
 * Data awal: 5 kampus (KL, GS1, GS2, GK, ICON), staf IT 2-4 orang per kampus,
 * 1 Kepala IT Pusat, dan beberapa contoh tugas demo di berbagai tahap alur kerja.
 *
 * Dipakai oleh prisma/seed.ts (CLI, lokal) — satu sumber kebenaran data seed
 * supaya tidak duplikasi logika.
 */
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateTaskId } from "@/lib/taskUtils";

export const SEED_DEFAULT_PASSWORD = "ItSpk2026!";
const DOMAIN = "spkkatolik.sch.id";

const CAMPUSES: { code: "KL" | "GS1" | "GS2" | "GK" | "ICON"; name: string }[] = [
  { code: "KL", name: "Kampus KL" },
  { code: "GS1", name: "Kampus GS1" },
  { code: "GS2", name: "Kampus GS2" },
  { code: "GK", name: "Kampus GK" },
  { code: "ICON", name: "Kampus Icon" },
];

const STAFF_PLAN: Record<string, string[]> = {
  KL: ["Andi Saputra", "Budi Santoso"],
  GS1: ["Citra Dewi", "Dedi Kurniawan", "Eka Prasetya"],
  GS2: ["Fajar Nugroho", "Gita Ayu"],
  GK: ["Hendra Wijaya", "Indah Permata", "Joko Widodo"],
  ICON: ["Kurnia Ramadhan", "Lestari Wulandari"],
};

/**
 * PENTING: pertahankan digit (0-9), jangan hanya [^a-z] — kode kampus seperti
 * "GS1"/"GS2" mengandung angka. Regex lama membuang digit, sehingga email
 * "koordinator.GS1" dan "koordinator.GS2" sama-sama menjadi "koordinator.gs.@..."
 * dan saling menimpa (bug nyata yang pernah terjadi di production).
 */
function slugEmail(name: string, domain: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".") + "@" + domain;
}

export async function seedDatabase(prisma: PrismaClient): Promise<{ log: string[] }> {
  const log: string[] = [];
  const passwordHash = await bcrypt.hash(SEED_DEFAULT_PASSWORD, 10);

  log.push("Seeding kampus...");
  const campusRecords = new Map<string, { id: string; code: string }>();
  for (const c of CAMPUSES) {
    const campus = await prisma.campus.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { code: c.code, name: c.name },
    });
    campusRecords.set(c.code, campus);
  }

  log.push("Seeding Kepala IT Pusat...");
  await prisma.staff.upsert({
    where: { email: `kepala.it@${DOMAIN}` },
    update: {},
    create: {
      name: "Kepala IT Pusat",
      email: `kepala.it@${DOMAIN}`,
      passwordHash,
      role: "KEPALA_IT_PUSAT",
      campusId: null,
    },
  });

  const createdStaff: { id: string; email: string; role: string; campusCode: string }[] = [];

  for (const c of CAMPUSES) {
    const campus = campusRecords.get(c.code)!;
    const names = STAFF_PLAN[c.code];

    const coordinatorEmail = slugEmail(`koordinator.${c.code}`, DOMAIN);
    const coordinator = await prisma.staff.upsert({
      where: { email: coordinatorEmail },
      update: {},
      create: {
        name: `Koordinator IT ${c.name}`,
        email: coordinatorEmail,
        passwordHash,
        role: "KOORDINATOR_KAMPUS",
        campusId: campus.id,
      },
    });
    createdStaff.push({ id: coordinator.id, email: coordinator.email, role: coordinator.role, campusCode: c.code });

    for (const name of names) {
      const email = slugEmail(name, DOMAIN);
      const staff = await prisma.staff.upsert({
        where: { email },
        update: {},
        create: {
          name,
          email,
          passwordHash,
          role: "STAF_IT",
          campusId: campus.id,
        },
      });
      createdStaff.push({ id: staff.id, email: staff.email, role: staff.role, campusCode: c.code });
    }
  }

  log.push("Seeding contoh tugas demo...");
  const sampleTasks: {
    kampus: "KL" | "GS1" | "GS2" | "GK" | "ICON";
    kategori: string;
    prioritas: string;
    deskripsi: string;
    pelapor: string;
    status: string;
    hoursAgo: number;
  }[] = [
    { kampus: "KL", kategori: "Jaringan", prioritas: "Urgent", deskripsi: "Koneksi internet ruang guru terputus", pelapor: "Bu Ratna (Guru KL)", status: "Baru", hoursAgo: 1 },
    { kampus: "GS1", kategori: "Proyektor/AV", prioritas: "Tinggi", deskripsi: "Proyektor kelas 5B mati total", pelapor: "Pak Yusuf (Wali Kelas 5B)", status: "Diproses", hoursAgo: 3 },
    { kampus: "GS1", kategori: "Software", prioritas: "Sedang", deskripsi: "Instal ulang aplikasi rapor digital di lab komputer", pelapor: "Bu Sari (TU)", status: "Menunggu Verifikasi", hoursAgo: 20 },
    { kampus: "GS2", kategori: "Hardware", prioritas: "Rendah", deskripsi: "Ganti mouse rusak di ruang admin", pelapor: "Pak Anton (Admin)", status: "Selesai", hoursAgo: 96 },
    { kampus: "GK", kategori: "CCTV", prioritas: "Tinggi", deskripsi: "CCTV gerbang utama tidak merekam", pelapor: "Satpam GK", status: "Tindak Lanjut", hoursAgo: 30 },
    { kampus: "ICON", kategori: "Akun/Akses", prioritas: "Sedang", deskripsi: "Reset akses akun email staf baru", pelapor: "HRD Icon", status: "Baru", hoursAgo: 2 },
  ];

  const now = new Date();
  // Nomor urut per kampus (bukan counter global) — supaya konsisten dengan
  // cara createTask() menomori tugas asli (nomor tertinggi per kampus + 1).
  const counters: Record<string, number> = {};
  for (const s of sampleTasks) {
    const campus = campusRecords.get(s.kampus)!;
    const jamInput = new Date(now.getTime() - s.hoursAgo * 60 * 60 * 1000);
    counters[s.kampus] = (counters[s.kampus] ?? 0) + 1;
    const idTugas = generateTaskId(s.kampus, jamInput, counters[s.kampus]);
    const staffForCampus = createdStaff.find((st) => st.campusCode === s.kampus && st.role === "STAF_IT");

    const exists = await prisma.task.findUnique({ where: { idTugas } });
    if (exists) continue;

    await prisma.task.create({
      data: {
        idTugas,
        campusId: campus.id,
        kategori: s.kategori,
        prioritas: s.prioritas,
        deskripsi: s.deskripsi,
        pelapor: s.pelapor,
        status: s.status,
        jamInput,
        jamMulaiProses: s.status !== "Baru" ? new Date(jamInput.getTime() + 15 * 60 * 1000) : null,
        jamOutput: ["Menunggu Verifikasi", "Tindak Lanjut", "Selesai"].includes(s.status)
          ? new Date(jamInput.getTime() + 2 * 60 * 60 * 1000)
          : null,
        jamPenyelesaian: s.status === "Selesai" ? new Date(jamInput.getTime() + 4 * 60 * 60 * 1000) : null,
        hasilEvaluasi: s.status === "Selesai" ? "Sesuai" : s.status === "Tindak Lanjut" ? "Perlu Perbaikan" : null,
        catatanTindakLanjut: s.status === "Tindak Lanjut" ? "Rekaman masih terputus-putus, cek kabel & storage NVR" : null,
        assignedStaffId: staffForCampus?.id ?? null,
      },
    });
  }

  log.push("Seed selesai.");
  log.push(`Password default: ${SEED_DEFAULT_PASSWORD}`);
  log.push(`Kepala IT Pusat : kepala.it@${DOMAIN}`);
  for (const c of CAMPUSES) {
    log.push(`Koordinator ${c.code.padEnd(4)}: koordinator.${c.code.toLowerCase()}@${DOMAIN}`);
  }

  return { log };
}
