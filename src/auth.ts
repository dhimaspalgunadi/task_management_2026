import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const staff = await prisma.staff.findUnique({
          where: { email: email.toLowerCase() },
          include: { campus: true },
        });
        if (!staff || !staff.active) return null;

        const valid = await bcrypt.compare(password, staff.passwordHash);
        if (!valid) return null;

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          campusId: staff.campusId,
          campusCode: staff.campus?.code ?? null,
        };
      },
    }),
  ],
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
});
