import { handle, parseBody, getOwnedProject } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    return proj;
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const body = await parseBody<Record<string, unknown>>(req);

    const allowed = [
      "title", "topic", "niche", "format", "language", "voice",
      "narrationSpeed", "subtitleStyle", "tone", "targetLength",
      "keywords", "musicBed", "platforms", "approvalPolicy", "status",
    ];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) data[k] = body[k];
    if (data.format && !["16-9", "9-16", "1-1"].includes(String(data.format)))
      return Response.json({ detail: "invalid format" }, { status: 422 });
    if (
      data.status &&
      !["draft", "generating", "pending_review", "approved", "published", "rejected"].includes(
        String(data.status)
      )
    )
      return Response.json({ detail: "invalid status" }, { status: 422 });

    return db.videoProject.update({ where: { id: proj.id }, data });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const title = proj.title;
    await db.videoProject.delete({ where: { id: proj.id } });
    return { message: "Project deleted", detail: title };
  });
}
