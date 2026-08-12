import Navbar from "@/components/Navbar";
import NewTaskForm from "@/components/NewTaskForm";

export default function NewTaskPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-gray-800">Buat Tugas Baru</h1>
        <p className="mb-6 text-sm text-gray-500">Tahap 1 — Input tugas ke sistem</p>
        <NewTaskForm />
      </main>
    </div>
  );
}
