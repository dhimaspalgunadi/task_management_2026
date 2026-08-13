/**
 * Isi database lokal dengan 5 kampus, staf demo, dan contoh tugas.
 * Jalankan: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/lib/seedData";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(({ log }) => log.forEach((line) => console.log(line)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
