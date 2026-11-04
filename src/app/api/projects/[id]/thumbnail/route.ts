import path from "path";
import { handle, getOwnedProject } from "@/lib/route";
import { requireUser } from "@/lib/auth";
import { generateThumbnail } from "@/lib/ai/thumbnail";
import { saveArtifact } from "@/lib/ai/artifacts";

export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);

    const publicRoot = path.join(process.cwd(), "public");
    const res = await generateThumbnail({
      title: proj.title,
      topic: proj.topic,
      niche: proj.niche,
      format: proj.format,
      projectId: proj.id,
      publicRoot,
    });
    await saveArtifact(proj.id, "thumbnail", {
      prompt: res.prompt,
      size: res.size,
    }, res.url);
    return res;
  });
