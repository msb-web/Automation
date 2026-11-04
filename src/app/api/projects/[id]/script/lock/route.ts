import { handle, getOwnedProject } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    if (!proj.script || !proj.script.content.trim())
      return Response.json({ detail: "Cannot lock an empty script" }, { status: 400 });

    const now = new Date();
    await db.workflowRun.updateMany({
      where: { projectId: proj.id, stage: "script" },
      data: { status: "done", progress: 100, finishedAt: now },
    });
    await db.workflowRun.updateMany({
      where: { projectId: proj.id, stage: "voice" },
      data: { status: "running", progress: 5, startedAt: now },
    });
    return { message: "Script locked", detail: "Voice synthesis stage started" };
  });
