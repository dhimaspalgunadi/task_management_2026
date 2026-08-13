import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seedData";

/**
 * Endpoint sekali-pakai untuk mengisi data awal (5 kampus, staf demo, contoh
 * tugas) ke database production, dipanggil manual sekali lewat curl/Postman
 * dengan header x-seed-token yang cocok dengan env var SEED_TOKEN.
 * Aman dipanggil berkali-kali (idempotent, pakai upsert).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.SEED_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "SEED_TOKEN belum diset di environment variables" }, { status: 503 });
  }

  const provided = req.headers.get("x-seed-token");
  if (provided !== expected) {
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
