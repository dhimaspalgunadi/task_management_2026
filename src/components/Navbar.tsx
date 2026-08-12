"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Sparkles, PlusCircle } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  STAF_IT: "Staf IT",
  KOORDINATOR_KAMPUS: "Koordinator Kampus",
  KEPALA_IT_PUSAT: "Kepala IT Pusat",
};

export default function Navbar() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-purple-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white shadow-md">
            <Sparkles size={18} />
          </span>
          <span>
            SIGAP <span className="text-pink-500">IT</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/tasks/new"
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:flex"
          >
            <PlusCircle size={16} /> Tugas Baru
          </Link>

          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-purple-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
              {session.user.name?.slice(0, 1).toUpperCase() ?? "?"}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-xs font-semibold text-gray-800">{session.user.name}</p>
              <p className="text-[10px] text-gray-500">
                {ROLE_LABEL[session.user.role] ?? session.user.role}
                {session.user.campusCode ? ` · ${session.user.campusCode}` : " · Pusat"}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-red-50 hover:text-red-500"
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
