import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi NextAuth yang aman dipakai di Edge Middleware (src/proxy.ts) —
 * TIDAK boleh mengimpor apa pun yang menyeret Prisma/bcrypt ke sini, karena
 * Edge Middleware tidak bisa memuat native addon (.node) seperti query engine
 * Prisma. Logika login sesungguhnya (Credentials provider + Prisma) hidup di
 * src/auth.ts, yang hanya dipakai di Route Handler & Server Component (Node.js
 * runtime, bukan Edge).
 */
export const authConfig: NextAuthConfig = {
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
};
