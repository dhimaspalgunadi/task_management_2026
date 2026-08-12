import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canSeeAllCampuses } from "@/lib/authz";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      campus: true,
      assignedStaff: true,
      logs: { include: { changedBy: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  if (!canSeeAllCampuses(user.role) && task.campusId !== user.campusId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ task });
}
