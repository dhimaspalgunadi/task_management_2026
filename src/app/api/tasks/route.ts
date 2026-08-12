import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canSeeAllCampuses } from "@/lib/authz";
import { createTask, WorkflowError } from "@/lib/workflow";

export async function GET(req: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kampusParam = searchParams.get("kampus");
  const statusParam = searchParams.get("status");
  const staffParam = searchParams.get("staffId");

  const where: Record<string, unknown> = {};

  if (!canSeeAllCampuses(user.role)) {
    if (!user.campusId) return NextResponse.json({ tasks: [] });
    where.campusId = user.campusId;
  } else if (kampusParam) {
    const campus = await prisma.campus.findUnique({ where: { code: kampusParam as never } });
    if (campus) where.campusId = campus.id;
  }

  if (statusParam) where.status = statusParam;
  if (staffParam) where.assignedStaffId = staffParam;

  const tasks = await prisma.task.findMany({
    where,
    include: { campus: true, assignedStaff: true },
    orderBy: { jamInput: "desc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const campusId = canSeeAllCampuses(user.role) && body.campusId ? body.campusId : user.campusId;
  if (!campusId) {
    return NextResponse.json({ error: "Kampus tidak ditentukan" }, { status: 400 });
  }
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) return NextResponse.json({ error: "Kampus tidak valid" }, { status: 400 });

  try {
    const task = await createTask({
      campusId: campus.id,
      kampusCode: campus.code,
      kategori: body.kategori,
      prioritas: body.prioritas,
      deskripsi: body.deskripsi,
      pelapor: body.pelapor,
      jamInput: body.jamInput ?? new Date().toISOString(),
      noSuratPenugasan: body.noSuratPenugasan,
      assignedStaffId: body.assignedStaffId,
      createdById: user.id,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}
