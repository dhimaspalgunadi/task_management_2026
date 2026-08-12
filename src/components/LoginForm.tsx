"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email atau kata sandi salah.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white shadow-lg">
            <Sparkles size={28} />
          </span>
          <h1 className="text-2xl font-extrabold text-purple-800">SIGAP IT</h1>
          <p className="text-sm text-gray-500">
            Sistem Monitoring Tugas Unit IT — 5 Kampus SPK Katolik
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-white bg-white/80 p-6 shadow-xl backdrop-blur-md"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@spkkatolik.sch.id"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 transition focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 transition focus:ring-2"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            <LogIn size={16} />
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          Kampus: KL &middot; GS1 &middot; GS2 &middot; GK &middot; Icon
        </p>
      </div>
    </div>
  );
}
