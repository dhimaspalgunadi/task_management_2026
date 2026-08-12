import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canSeeAllCampuses } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kampusParam = searchParams.get("kampus");

  const where: Record<string, unknown> = { active: true };

  if (!canSeeAllCampuses(user.role)) {
    where.campusId = user.campusId;
  } else if (kampusParam) {
    const campus = await prisma.campus.findUnique({ where: { code: kampusParam as never } });
    if (campus) where.campusId = campus.id;
  }

  const staff = await prisma.staff.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, campusId: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ staff });
}
