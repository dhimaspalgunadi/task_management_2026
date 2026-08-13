import Navbar from "@/components/Navbar";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-gray-800">Ganti Password</h1>
        <p className="mb-6 text-sm text-gray-500">Perbarui password akun kamu secara berkala untuk keamanan.</p>
        <ChangePasswordForm />
      </main>
    </div>
  );
}
