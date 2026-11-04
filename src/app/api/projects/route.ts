import { handle, parseBody } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = (req: Request) =>
  handle(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));

    const where = {
      ...(user.role !== "admin" ? { userId: user.id } : {}),
      ...(status ? { status } : {}),
    };
    return db.videoProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const user = await requireUser();
    const body = await parseBody<{
      title: string;
      topic: string;
      niche: string;
      format: string;
      language?: string;
      voice?: string;
      narrationSpeed?: number;
      subtitleStyle?: string;
      tone?: string;
      targetLength?: string;
      keywords?: string;
      musicBed?: string;
      platforms?: string;
      approvalPolicy?: string;
    }>(req);

    if (!body.title || !body.topic || !body.niche)
      return Response.json({ detail: "title, topic and niche are required" }, { status: 422 });
    if (!["16-9", "9-16", "1-1"].includes(body.format))
      return Response.json({ detail: "format must be 16-9, 9-16 or 1-1" }, { status: 422 });

    const proj = await db.videoProject.create({
      data: {
        userId: user.id,
        title: body.title,
        topic: body.topic,
        niche: body.niche,
        format: body.format,
        language: body.language || "en-US",
        voice: body.voice || "en-us-female",
        narrationSpeed: body.narrationSpeed ?? 1.0,
        subtitleStyle: body.subtitleStyle || "minimal",
        tone: body.tone || "Educational",
        targetLength: body.targetLength || "Auto",
        keywords: body.keywords || "",
        musicBed: body.musicBed || "Auto-match",
        platforms: body.platforms || "youtube,facebook",
        approvalPolicy: ["manual", "auto"].includes(body.approvalPolicy || "")
          ? body.approvalPolicy!
          : "manual",
      },
    });
    // Every project starts with an empty script row.
    await db.script.create({ data: { projectId: proj.id } });
    return Response.json(proj, { status: 201 });
  });
