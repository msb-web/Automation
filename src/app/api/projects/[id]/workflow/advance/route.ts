import { handle, getOwnedProject } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/auth";
import { WORKFLOW_STAGES } from "@/lib/seed";

export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);

    const runs = proj.workflowRuns;
    if (!runs.length) throw new HttpError(409, "No workflow runs — call /generate first");

    const now = new Date();
    const running = runs.find((r) => r.status === "running") || null;
    let nextStage: string | null = null;

    if (running) {
      await db.workflowRun.update({
        where: { id: running.id },
        data: { status: "done", progress: 100, finishedAt: now },
      });
      const idx = WORKFLOW_STAGES.indexOf(running.stage as (typeof WORKFLOW_STAGES)[number]);
      nextStage = idx + 1 < WORKFLOW_STAGES.length ? WORKFLOW_STAGES[idx + 1] : null;
    } else {
      const pending = runs.filter((r) => r.status === "pending");
      nextStage = pending[0]?.stage ?? null;
    }

    const nextRun = nextStage ? runs.find((r) => r.stage === nextStage) : null;
    let target;
    if (nextRun) {
      target = await db.workflowRun.update({
        where: { id: nextRun.id },
        data: { status: "running", progress: Math.max(nextRun.progress, 15), startedAt: now },
      });
    } else if (!running) {
      throw new HttpError(409, "Pipeline already complete");
    } else {
      target = running; // just finished the last stage
    }

    // Reflect stage progression onto the project status.
    let newStatus: string | null = null;
    if (nextStage === "review" && proj.approvalPolicy === "manual") {
      newStatus = "pending_review";
    } else if (!nextStage && running && running.stage === "review") {
      newStatus = "approved"; // auto-policy path through review
    }
    if (newStatus) {
      await db.videoProject.update({ where: { id: proj.id }, data: { status: newStatus } });
    }
    return target;
  });
