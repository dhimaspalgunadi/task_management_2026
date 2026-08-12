import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    campusId?: string | null;
    campusCode?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      campusId: string | null;
      campusCode: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    campusId?: string | null;
    campusCode?: string | null;
  }
}
