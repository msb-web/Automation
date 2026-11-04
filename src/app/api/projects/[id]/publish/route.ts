import { handle, getOwnedProject } from "@/lib/route";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishToPlatforms, schedulePublish } from "@/lib/publish";

type PublishBody = { platforms?: string[]; scheduleAt?: string };

// Publish an approved video to its platforms now, or schedule it for later.
export const POST = (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const body = (await req.json().catch(() => ({}))) as PublishBody;

    if (proj.status !== "approved" && proj.status !== "published")
      return Response.json(
        { detail: "Can only publish approved projects" },
        { status: 409 }
      );

    const platforms = body.platforms?.length
      ? body.platforms
      : (proj.platforms || "youtube,facebook").split(",").map((s) => s.trim()).filter(Boolean);

    if (body.scheduleAt) {
      const when = new Date(body.scheduleAt);
      if (isNaN(when.getTime()) || when.getTime() <= Date.now())
        return Response.json(
          { detail: "scheduleAt must be a future ISO datetime" },
          { status: 400 }
        );
      await schedulePublish(proj, platforms, when);
      return {
        message: "Publish scheduled",
        detail: proj.title,
        platforms,
        scheduledAt: when.toISOString(),
      };
    }

    const { records } = await publishToPlatforms(proj, platforms);
    return { message: "Published", detail: proj.title, records };
  });

// List publish records for this project.
export const GET = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const records = await db.publishRecord.findMany({
      where: { projectId: proj.id },
      orderBy: { id: "desc" },
    });
    return { records };
  });
