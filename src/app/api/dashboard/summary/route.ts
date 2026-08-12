import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canSeeAllCampuses } from "@/lib/authz";
import { slaStatus, STATUS_VALID } from "@/lib/taskUtils";

export async function GET() {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: Record<string, unknown> = {};
  if (!canSeeAllCampuses(user.role)) {
    if (!user.campusId) return NextResponse.json({ perKampus: [], perStatus: {}, overdue: 0, total: 0 });
    where.campusId = user.campusId;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { campus: true, assignedStaff: true },
  });

  const perStatus: Record<string, number> = Object.fromEntries(STATUS_VALID.map((s) => [s, 0]));
  const perKampusMap = new Map<string, { kampus: string; total: number; selesai: number; overdue: number }>();
  let overdue = 0;

  for (const t of tasks) {
    perStatus[t.status] = (perStatus[t.status] ?? 0) + 1;

    const kampusCode = t.campus.code;
    if (!perKampusMap.has(kampusCode)) {
      perKampusMap.set(kampusCode, { kampus: kampusCode, total: 0, selesai: 0, overdue: 0 });
    }
    const entry = perKampusMap.get(kampusCode)!;
    entry.total += 1;
    if (t.status === "Selesai") entry.selesai += 1;

    const sla = slaStatus({
      prioritas: t.prioritas,
      jamInput: t.jamInput.toISOString(),
      jamMulaiProses: t.jamMulaiProses?.toISOString() ?? null,
      jamPenyelesaian: t.jamPenyelesaian?.toISOString() ?? null,
      noSuratPenugasan: t.noSuratPenugasan,
    });
    if (sla.respons.startsWith("Overdue") || sla.penyelesaian.startsWith("Overdue")) {
      overdue += 1;
      entry.overdue += 1;
    }
  }

  return NextResponse.json({
    total: tasks.length,
    perStatus,
    perKampus: Array.from(perKampusMap.values()),
    overdue,
  });
}
