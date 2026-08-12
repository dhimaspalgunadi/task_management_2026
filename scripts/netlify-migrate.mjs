// Dijalankan saat build di Netlify. Kalau DATABASE_URL belum diset manual,
// ambil dari Netlify Database (paket @netlify/database) sebelum menjalankan
// migrasi Prisma, supaya "prisma migrate deploy" tahu harus konek ke mana.
import { execSync } from "node:child_process";

async function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const { getConnectionString } = await import("@netlify/database");
    return getConnectionString();
  } catch {
    return undefined;
  }
}

const url = await resolveDatabaseUrl();

if (!url) {
  console.error(
    "[netlify-migrate] Tidak menemukan DATABASE_URL maupun koneksi Netlify Database. " +
      "Set env var DATABASE_URL di Netlify, atau pastikan Netlify Database sudah aktif untuk site ini."
  );
  process.exit(1);
}

process.env.DATABASE_URL = url;
console.log("[netlify-migrate] Menjalankan migrasi Prisma...");
execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
