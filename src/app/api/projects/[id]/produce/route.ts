import { handle, getOwnedProject } from "@/lib/route";
import { requireUser } from "@/lib/auth";
import { createJob } from "@/lib/video/jobs";
import { produceVideo } from "@/lib/video/producer";

export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const job = createJob(proj.id);
    // Fire and forget — the pipeline updates job state as it runs.
    void produceVideo(job.id, proj);
    return { jobId: job.id, status: "running", projectId: proj.id };
  });
