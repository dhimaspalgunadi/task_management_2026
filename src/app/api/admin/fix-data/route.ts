import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seedData";

/**
 * Endpoint sekali-pakai untuk membetulkan data production yang rusak akibat
 * bug slugEmail lama (koordinator GS1 & GS2 bentrok jadi satu email
 * "koordinator.gs.@..."). Dikunci token yang harus cocok dengan env var
 * FIX_TOKEN. Aman dipanggil berkali-kali (idempotent).
 *
 * HAPUS route ini setelah dipakai sekali — sama seperti pola endpoint seed
 * sebelumnya, ini bukan sesuatu yang perlu terus terbuka di production.
 */
async function runFix(providedToken: string | null) {
  const expected = process.env.FIX_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "FIX_TOKEN belum diset di environment variables" }, { status: 503 });
  }
  if (providedToken !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const strayEmail = "koordinator.gs.@spkkatolik.sch.id";
    const stray = await prisma.staff.findUnique({ where: { email: strayEmail } });

    let removedStray = false;
    if (stray) {
      await prisma.task.updateMany({ where: { assignedStaffId: stray.id }, data: { assignedStaffId: null } });
      await prisma.taskLog.updateMany({ where: { changedById: stray.id }, data: { changedById: null } });
      await prisma.staff.delete({ where: { id: stray.id } });
      removedStray = true;
    }

    const { log } = await seedDatabase(prisma);
    return NextResponse.json({ ok: true, removedStray, log });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Fix gagal", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return runFix(req.headers.get("x-fix-token"));
}

export async function GET(req: NextRequest) {
  return runFix(req.nextUrl.searchParams.get("token"));
}
