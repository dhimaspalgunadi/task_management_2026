import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const currentPassword = body.currentPassword as string | undefined;
  const newPassword = body.newPassword as string | undefined;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Password saat ini dan password baru wajib diisi" }, { status: 400 });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter` },
      { status: 400 }
    );
  }

  const staff = await prisma.staff.findUnique({ where: { id: user.id } });
  if (!staff) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, staff.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.staff.update({ where: { id: staff.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
