-- CreateEnum
CREATE TYPE "KampusCode" AS ENUM ('KL', 'GS1', 'GS2', 'GK', 'ICON');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('STAF_IT', 'KOORDINATOR_KAMPUS', 'KEPALA_IT_PUSAT');

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "code" "KampusCode" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAF_IT',
    "campusId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "idTugas" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "prioritas" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "pelapor" TEXT NOT NULL,
    "assignedStaffId" TEXT,
    "jamInput" TIMESTAMP(3) NOT NULL,
    "jamMulaiProses" TIMESTAMP(3),
    "jamOutput" TIMESTAMP(3),
    "hasilEvaluasi" TEXT,
    "catatanTindakLanjut" TEXT,
    "jamPenyelesaian" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Baru',
    "noSuratPenugasan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_logs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campuses_code_key" ON "campuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "staff_campusId_idx" ON "staff"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_idTugas_key" ON "tasks"("idTugas");

-- CreateIndex
CREATE INDEX "tasks_campusId_idx" ON "tasks"("campusId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_assignedStaffId_idx" ON "tasks"("assignedStaffId");

-- CreateIndex
CREATE INDEX "task_logs_taskId_idx" ON "task_logs"("taskId");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
