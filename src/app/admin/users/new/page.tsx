import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isKepalaItPusat } from "@/lib/authz";
import Navbar from "@/components/Navbar";
import NewUserForm from "@/components/NewUserForm";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user || !isKepalaItPusat(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-gray-800">Tambah User Baru</h1>
        <p className="mb-6 text-sm text-gray-500">Buat akun staf IT baru untuk salah satu kampus.</p>
        <NewUserForm />
      </main>
    </div>
  );
}
