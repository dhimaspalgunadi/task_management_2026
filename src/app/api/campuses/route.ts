import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";

export async function GET() {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campuses = await prisma.campus.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ campuses });
}
