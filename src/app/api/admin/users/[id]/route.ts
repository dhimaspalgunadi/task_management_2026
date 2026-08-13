import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, isKepalaItPusat, ROLES } from "@/lib/authz";

const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES = Object.values(ROLES) as string[];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isKepalaItPusat(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    if (!body.name.trim()) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    data.name = body.name.trim();
  }

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email tidak boleh kosong" }, { status: 400 });
    if (email !== target.email) {
      const clash = await prisma.staff.findUnique({ where: { email } });
      if (clash) return NextResponse.json({ error: "Email sudah dipakai akun lain" }, { status: 409 });
    }
    data.email = email;
  }

  if (typeof body.role === "string") {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: `Peran tidak valid. Pilihan: ${VALID_ROLES.join(", ")}` }, { status: 400 });
    }
    data.role = body.role;
  }

  const effectiveRole = (data.role as string | undefined) ?? target.role;
  if (body.campusId !== undefined) {
    if (effectiveRole !== ROLES.KEPALA_IT_PUSAT && !body.campusId) {
      return NextResponse.json({ error: "Kampus wajib diisi untuk peran ini" }, { status: 400 });
    }
    data.campusId = effectiveRole === ROLES.KEPALA_IT_PUSAT ? null : body.campusId;
  } else if (data.role !== undefined && effectiveRole === ROLES.KEPALA_IT_PUSAT) {
    data.campusId = null;
  }

  if (typeof body.active === "boolean") {
    if (!body.active && id === user.id) {
      return NextResponse.json({ error: "Tidak bisa menonaktifkan akun sendiri" }, { status: 400 });
    }
    data.active = body.active;
  }

  if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
    if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter` }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  const updated = await prisma.staff.update({ where: { id }, data });
  return NextResponse.json({ staff: { id: updated.id, name: updated.name, email: updated.email } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isKepalaItPusat(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  await prisma.task.updateMany({ where: { assignedStaffId: id }, data: { assignedStaffId: null } });
  await prisma.taskLog.updateMany({ where: { changedById: id }, data: { changedById: null } });
  await prisma.staff.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
