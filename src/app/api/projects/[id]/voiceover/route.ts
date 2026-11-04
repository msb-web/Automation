import path from "path";
import { handle, getOwnedProject } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { synthesizeVoiceover } from "@/lib/ai/tts";
import { saveArtifact } from "@/lib/ai/artifacts";

// Map a project's configured voice to a z-ai TTS voice id.
const ZAI_VOICE: Record<string, string> = {
  female: "tongtong",
  male: "jam",
};
function voiceFor(voice: string): string {
  if (voice.includes("female")) return ZAI_VOICE.female;
  if (voice.includes("male")) return ZAI_VOICE.male;
  return "tongtong";
}

export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const proj = await getOwnedProject(Number(id), user);
    const scriptText = proj.script?.content || "";
    if (!scriptText.trim())
      return Response.json(
        { detail: "Generate or write a script before creating a voiceover" },
        { status: 400 }
      );

    const publicRoot = path.join(process.cwd(), "public");
    const res = await synthesizeVoiceover({
      scriptText,
      voice: voiceFor(proj.voice),
      speed: proj.narrationSpeed,
      projectId: proj.id,
      publicRoot,
    });
    await saveArtifact(proj.id, "voiceover", {
      durationSec: res.durationSec,
      segments: res.segments,
      provider: res.provider,
      voice: proj.voice,
    }, res.url);
    return res;
  });
