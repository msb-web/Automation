import { handle } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = () =>
  handle(async () => {
    const user = await requireUser();
    const runs = await db.workflowRun.findMany({
      where: {
        status: "running",
        ...(user.role !== "admin" ? { project: { userId: user.id } } : {}),
      },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { startedAt: "desc" },
    });
    return runs.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      projectTitle: r.project.title,
      stage: r.stage,
      status: r.status,
      progress: r.progress,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      createdAt: r.createdAt,
    }));
  });
