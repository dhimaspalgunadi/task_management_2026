import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { StaffRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, isKepalaItPusat, ROLES } from "@/lib/authz";

const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES = Object.values(ROLES) as string[];

export async function GET() {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isKepalaItPusat(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const staff = await prisma.staff.findMany({
    include: { campus: true },
    orderBy: [{ campusId: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      active: s.active,
      campusId: s.campusId,
      campusCode: s.campus?.code ?? null,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isKepalaItPusat(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const password = body.password as string | undefined;
  const role = body.role as string | undefined;
  const campusId = (body.campusId as string | undefined) || null;

  if (!name) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Peran tidak valid. Pilihan: ${VALID_ROLES.join(", ")}` }, { status: 400 });
  }
  if (role !== ROLES.KEPALA_IT_PUSAT && !campusId) {
    return NextResponse.json({ error: "Kampus wajib diisi untuk peran ini" }, { status: 400 });
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter` }, { status: 400 });
  }

  const existing = await prisma.staff.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email sudah dipakai akun lain" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const staff = await prisma.staff.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as StaffRole,
      campusId: role === ROLES.KEPALA_IT_PUSAT ? null : campusId,
    },
  });

  return NextResponse.json({ staff: { id: staff.id, name: staff.name, email: staff.email } }, { status: 201 });
}
