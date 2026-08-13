"use server";

import { signOut } from "@/auth";

/**
 * Server Action untuk logout — dijalankan sepenuhnya di server (bukan lewat
 * fetch dari browser seperti signOut() milik next-auth/react), supaya bebas
 * dari isu CSRF/redirect construction yang sempat gagal diam-diam di Netlify.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
