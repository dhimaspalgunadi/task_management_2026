import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  campusId: string | null;
  campusCode: string | null;
};

export const ROLES = {
  STAF_IT: "STAF_IT",
  KOORDINATOR_KAMPUS: "KOORDINATOR_KAMPUS",
  KEPALA_IT_PUSAT: "KEPALA_IT_PUSAT",
} as const;

/** Kepala IT Pusat melihat semua kampus; peran lain dibatasi ke kampusnya sendiri. */
export function canSeeAllCampuses(role: string): boolean {
  return role === ROLES.KEPALA_IT_PUSAT;
}

/** Hanya Koordinator Kampus & Kepala IT Pusat yang boleh menyetujui penyelesaian tugas. */
export function canApproveCompletion(role: string): boolean {
  return role === ROLES.KOORDINATOR_KAMPUS || role === ROLES.KEPALA_IT_PUSAT;
}

/** Hanya Kepala IT Pusat yang boleh mengelola akun staf (tambah/ubah/nonaktifkan/hapus). */
export function isKepalaItPusat(role: string): boolean {
  return role === ROLES.KEPALA_IT_PUSAT;
}

export async function requireSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}
