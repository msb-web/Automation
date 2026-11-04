import { handle, getOwnedProject } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { computeMetrics } from "@/lib/seed";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    if (!proj.script) {
      proj.script = await db.script.create({ data: { projectId: proj.id } });
    }
    return proj.script;
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const { content } = (await req.json()) as { content: string };
    if (content === undefined)
      return Response.json({ detail: "content is required" }, { status: 422 });

    // Lazily create the script row if it was missing.
    let script = proj.script;
    if (!script) {
      script = await db.script.create({ data: { projectId: proj.id } });
    }
    const metrics = computeMetrics(content, proj.narrationSpeed);
    const updated = await db.script.update({
      where: { projectId: proj.id },
      data: { content, ...metrics, version: script.version + 1 },
    });
    return updated;
  });
}
