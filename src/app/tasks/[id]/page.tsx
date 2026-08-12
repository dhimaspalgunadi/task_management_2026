import Navbar from "@/components/Navbar";
import TaskDetail from "@/components/TaskDetail";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <TaskDetail id={id} />
      </main>
    </div>
  );
}
