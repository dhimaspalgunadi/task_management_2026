import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import {
  mulaiProses,
  submitOutput,
  evaluasi,
  selesaikanTindakLanjut,
  selesaikanTugas,
  WorkflowError,
} from "@/lib/workflow";

const ACTIONS = [
  "mulai_proses",
  "submit_output",
  "evaluasi",
  "tindak_lanjut_selesai",
  "selesaikan",
] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const action = body.action as (typeof ACTIONS)[number];

  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: `Aksi tidak dikenal. Pilihan: ${ACTIONS.join(", ")}` }, { status: 400 });
  }

  try {
    let task;
    switch (action) {
      case "mulai_proses":
        task = await mulaiProses(id, user.id);
        break;
      case "submit_output":
        task = await submitOutput(id, user.id, body.catatanOutput);
        break;
      case "evaluasi":
        task = await evaluasi(id, user.id, body.hasilEvaluasi, body.catatanTindakLanjut);
        break;
      case "tindak_lanjut_selesai":
        task = await selesaikanTindakLanjut(id, user.id, body.catatan);
        break;
      case "selesaikan":
        task = await selesaikanTugas(id, user.id, user.role);
        break;
    }
    return NextResponse.json({ task });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Gagal memproses transisi tugas" }, { status: 500 });
  }
}
