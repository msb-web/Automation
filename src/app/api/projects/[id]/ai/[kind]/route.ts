import { handle, getOwnedProject, parseBody } from "@/lib/route";
import { db } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/auth";
import { llmProvider } from "@/lib/ai/provider";
import {
  researchTopic,
  generateIdeas,
  generateOutline,
  generateScript,
  generateDialogue,
  generateImagePrompts,
  generateSubtitles,
} from "@/lib/ai/generate";
import { saveArtifact } from "@/lib/ai/artifacts";
import { computeMetrics } from "@/lib/seed";

const KINDS = new Set([
  "research", "ideas", "outline", "script", "dialogue", "subtitles", "image-prompts",
]);

export const POST = (
  req: Request,
  { params }: { params: Promise<{ id: string; kind: string }> }
) =>
  handle(async () => {
    const user = await requireUser();
    const { id, kind } = await params;
    if (!KINDS.has(kind))
      return Response.json({ detail: `Unknown generation kind: ${kind}` }, { status: 404 });

    const proj = await getOwnedProject(Number(id), user);
    let body: Record<string, unknown> = {};
    try {
      body = await parseBody(req);
    } catch {
      /* empty body is fine */
    }
    const topic = String(body.topic || proj.topic);
    const niche = String(body.niche || proj.niche);
    const scriptText = proj.script?.content || "";
    const provider = await llmProvider();

    switch (kind) {
      case "research": {
        const r = await researchTopic(topic, niche);
        await saveArtifact(proj.id, "research", r);
        return { kind, content: r, provider };
      }
      case "ideas": {
        const r = await generateIdeas(topic, niche, Number(body.count) || 5);
        await saveArtifact(proj.id, "ideas", r);
        return { kind, content: r, provider };
      }
      case "outline": {
        const r = await generateOutline(proj);
        await saveArtifact(proj.id, "outline", r);
        return { kind, content: r, provider };
      }
      case "script": {
        const sg = await generateScript(proj);
        const m = computeMetrics(sg.scriptText, proj.narrationSpeed);
        // Persist into the Script model so the editor + later stages pick it up.
        const nextVersion = (proj.script?.version || 0) + 1;
        await db.script.upsert({
          where: { projectId: proj.id },
          update: { content: sg.scriptText, ...m, version: nextVersion },
          create: { projectId: proj.id, content: sg.scriptText, ...m },
        });
        const scenes = {
          title: sg.title,
          hook: sg.hook,
          scenes: sg.scenes,
          cta: sg.cta,
        };
        await saveArtifact(proj.id, "script_scenes", scenes);
        return {
          kind,
          content: {
            ...scenes,
            scriptText: sg.scriptText,
            wordCount: m.wordCount,
            estimatedDurationSec: m.estimatedDurationSec,
            version: nextVersion,
          },
          provider,
        };
      }
      case "dialogue": {
        if (!scriptText.trim()) throw new HttpError(400, "Generate a script first");
        const r = await generateDialogue(scriptText);
        await saveArtifact(proj.id, "dialogue", r);
        return { kind, content: r, provider };
      }
      case "subtitles": {
        if (!scriptText.trim()) throw new HttpError(400, "Generate a script first");
        const r = generateSubtitles(scriptText, proj.narrationSpeed, proj.language);
        await saveArtifact(proj.id, "subtitles", r);
        return { kind, content: r, provider };
      }
      case "image-prompts": {
        if (!scriptText.trim()) throw new HttpError(400, "Generate a script first");
        const r = await generateImagePrompts(scriptText, proj.format, proj.niche);
        await saveArtifact(proj.id, "image_prompts", r);
        return { kind, content: r, provider };
      }
    }
  });
