import { handle, getOwnedProject } from "@/lib/route";
import { requireUser } from "@/lib/auth";

export const GET = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    return proj.workflowRuns;
  });
