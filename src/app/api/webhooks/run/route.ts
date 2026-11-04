import { handle, getOwnedProject } from "@/lib/route";
import { authRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { createJob, getJob } from "@/lib/video/jobs";
import { produceVideo } from "@/lib/video/producer";
import { publishToPlatforms, schedulePublish } from "@/lib/publish";
import { notify } from "@/lib/notify";

type RunBody = {
  projectId?: number;
  publish?: boolean;
  autoApprove?: boolean;
  platforms?: string[];
  scheduleAt?: string;
};

// n8n entry point: kick off the full production pipeline (script → voiceover →
// video). Optionally publish after completion (autoApprove bypasses the manual
// checkpoint) or schedule the publish for a future time. Returns a jobId that
// n8n can poll via GET /api/projects/[id]/produce/status.
export const POST = (req: Request) =>
  handle(async () => {
    const user = await authRequest(req);
    const body = (await req.json().catch(() => ({}))) as RunBody;
    if (!body.projectId)
      return Response.json({ detail: "projectId required" }, { status: 400 });
    const proj = await getOwnedProject(Number(body.projectId), user);
    const job = createJob(proj.id);

    void (async () => {
      await notify("pipeline.started", { projectId: proj.id, jobId: job.id, publish: !!body.publish });
      await produceVideo(job.id, proj);
      const j = getJob(job.id);
      if (j?.status === "done") {
        const platforms = body.platforms?.length
          ? body.platforms
          : (proj.platforms || "youtube,facebook").split(",").map((s) => s.trim()).filter(Boolean);
        if (body.publish && body.autoApprove) {
          await db.videoProject.update({ where: { id: proj.id }, data: { status: "approved" } });
          if (body.scheduleAt) {
            await schedulePublish(proj, platforms, new Date(body.scheduleAt));
          } else {
            await publishToPlatforms(proj, platforms);
          }
        } else {
          // Manual approval checkpoint — surface for review and notify.
          await db.videoProject.update({ where: { id: proj.id }, data: { status: "pending_review" } });
          await notify("approval.requested", { projectId: proj.id, title: proj.title });
        }
      } else if (j?.status === "failed") {
        await notify("pipeline.failed", { projectId: proj.id, error: j.error });
      }
    })();

    return { jobId: job.id, status: "running", projectId: proj.id, publish: !!body.publish };
  });
