import { handle, getOwnedProject } from "@/lib/route";
import { requireUser } from "@/lib/auth";
import { latestJobFor, getJob } from "@/lib/video/jobs";

export const GET = (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const jobId = new URL(req.url).searchParams.get("jobId");
    const job = jobId ? getJob(jobId) : latestJobFor(proj.id);
    return job ?? { status: "idle", projectId: proj.id };
  });
