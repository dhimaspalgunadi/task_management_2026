import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi NextAuth yang bebas database.
 *
 * File ini sengaja TIDAK mengimpor Prisma (atau modul lain yang memakai
 * native binary), supaya bisa dipakai di `src/proxy.ts`. Proxy/Middleware
 * dibundel Netlify sebagai Edge Function yang tidak mendukung C++ addon
 * seperti query engine Prisma. Provider yang butuh database ditambahkan
 * terpisah di `src/auth.ts` (runtime Node.js).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.campusId = user.campusId;
        token.campusCode = user.campusCode;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.campusId = (token.campusId as string) ?? null;
        session.user.campusCode = (token.campusCode as string) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
