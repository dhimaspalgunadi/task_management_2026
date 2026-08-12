import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Kalau DATABASE_URL belum diisi manual (mis. di Netlify sebelum kita set
 * env var sendiri), coba ambil connection string dari Netlify Database
 * (paket @netlify/database, yang otomatis menyediakan Postgres saat deploy).
 * Dev lokal tetap pakai DATABASE_URL dari .env seperti biasa.
 */
function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getConnectionString } = require("@netlify/database");
    return getConnectionString();
  } catch {
    return undefined;
  }
}

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
