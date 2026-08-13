"use client";

import { useState } from "react";
import { KeyRound, CheckCircle2 } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengganti password");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-white bg-white/85 p-6 shadow-xl backdrop-blur-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Password Saat Ini</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Password Baru</label>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Konfirmasi Password Baru</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-purple-300 focus:ring-2"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      {success && (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          <CheckCircle2 size={16} /> Password berhasil diganti.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
      >
        <KeyRound size={16} />
        {loading ? "Menyimpan..." : "Ganti Password"}
      </button>
    </form>
  );
}
