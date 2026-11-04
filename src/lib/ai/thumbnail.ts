import fs from "fs";
import path from "path";
import { generateImage } from "./provider";

const SIZE_BY_FORMAT: Record<string, string> = {
  "16-9": "1344x768",
  "9-16": "720x1440",
  "1-1": "1024x1024",
};

function buildThumbnailPrompt(
  title: string,
  topic: string,
  niche: string,
  format: string
): string {
  const orient = format === "9-16" ? "vertical" : format === "1-1" ? "square" : "wide landscape";
  return `High-impact YouTube thumbnail art, ${orient}, for a ${niche} video about: ${topic}.
Concept inspired by the title "${title}". Bold high-contrast composition, vibrant saturated colors,
dramatic rim lighting, a clear focal subject, clean negative space on one side for a later text overlay.
No readable text, no words, no letters, no watermarks. Professional click-worthy thumbnail, ultra-detailed.`;
}

/** Generate a thumbnail image (PNG) for a project, written under public/gen/<id>/. */
export async function generateThumbnail(opts: {
  title: string;
  topic: string;
  niche: string;
  format: string;
  projectId: number;
  publicRoot: string;
}): Promise<{ url: string; prompt: string; size: string }> {
  const size = SIZE_BY_FORMAT[opts.format] || "1344x768";
  const prompt = buildThumbnailPrompt(opts.title, opts.topic, opts.niche, opts.format);
  const buf = await generateImage(prompt, size);
  const outDir = path.join(opts.publicRoot, "gen", String(opts.projectId));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "thumbnail.png"), buf);
  return { url: `/gen/${opts.projectId}/thumbnail.png`, prompt, size };
}
