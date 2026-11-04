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

    if (!["pending_review", "generating"].includes(proj.status))
      return Response.json(
        { detail: "Can only approve from pending_review or generating" },
        { status: 409 }
      );

    await db.videoProject.update({
      where: { id: proj.id },
      data: { status: "approved" },
    });
    return { message: "Project approved", detail: proj.title };
  });
