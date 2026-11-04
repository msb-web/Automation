import { handle, getOwnedProject } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WORKFLOW_STAGES } from "@/lib/seed";

export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);

    if (!["draft", "rejected", "generating"].includes(proj.status))
      return Response.json(
        { detail: "Can only generate from draft or rejected projects" },
        { status: 409 }
      );

    // Reset pipeline: remove old runs, create fresh ones with `script` running.
    await db.workflowRun.deleteMany({ where: { projectId: proj.id } });
    const now = new Date();
    for (let i = 0; i < WORKFLOW_STAGES.length; i++) {
      const stage = WORKFLOW_STAGES[i];
      await db.workflowRun.create({
        data:
          i === 0
            ? { projectId: proj.id, stage, status: "running", progress: 5, startedAt: now }
            : { projectId: proj.id, stage, status: "pending", progress: 0 },
      });
    }
    await db.videoProject.update({
      where: { id: proj.id },
      data: { status: "generating" },
    });
    return { message: "Generation started", detail: "script stage running" };
  });
