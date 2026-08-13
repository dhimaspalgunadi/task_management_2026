import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isKepalaItPusat } from "@/lib/authz";
import Navbar from "@/components/Navbar";
import UserManagement from "@/components/UserManagement";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !isKepalaItPusat(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-gray-800">Manajemen User</h1>
        <p className="mb-6 text-sm text-gray-500">
          Kelola akun staf IT: tambah, ubah, nonaktifkan, atau hapus akun di semua kampus.
        </p>
        <UserManagement />
      </main>
    </div>
  );
}
