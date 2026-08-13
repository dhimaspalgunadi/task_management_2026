import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seedData";

/**
 * Endpoint sekali-pakai untuk mengisi data awal (5 kampus, staf demo, contoh
 * tugas) ke database production. Dikunci token yang harus cocok dengan env
 * var SEED_TOKEN — boleh dikirim lewat header x-seed-token (curl/Postman)
 * atau query string ?token=... (supaya bisa dipicu cukup dengan buka link di
 * browser). Aman dipanggil berkali-kali (idempotent, pakai upsert).
 */
async function runSeed(providedToken: string | null) {
  const expected = process.env.SEED_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "SEED_TOKEN belum diset di environment variables" }, { status: 503 });
  }

  if (providedToken !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { log } = await seedDatabase(prisma);
    return NextResponse.json({ ok: true, log });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Seed gagal", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return runSeed(req.headers.get("x-seed-token"));
}

export async function GET(req: NextRequest) {
  return runSeed(req.nextUrl.searchParams.get("token"));
}
