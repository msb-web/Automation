import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { ttsChunk, ttsProvider } from "./provider";

const execFileP = promisify(execFile);
const MAX_CHUNK = 1000; // z-ai TTS limit per request

/** Pack text into ≤max-char chunks on sentence boundaries. */
export function splitIntoChunks(text: string, max = MAX_CHUNK): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if ((cur + " " + t).trim().length <= max) {
      cur = (cur + " " + t).trim();
    } else {
      if (cur) chunks.push(cur);
      if (t.length <= max) cur = t;
      else {
        for (let i = 0; i < t.length; i += max) chunks.push(t.slice(i, i + max));
        cur = "";
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function cleanForTTS(text: string): string {
  return text
    .replace(/\[[^\]]+\]/g, " ") // [HOOK]/[BODY]/[CTA]/Scene … markers
    .replace(/#\w+/g, "") // hashtags read poorly
    .replace(/\s+/g, " ")
    .trim();
}

/** Synthesize a full voiceover: chunk → TTS per chunk → ffmpeg concat → single WAV. */
export async function synthesizeVoiceover(opts: {
  scriptText: string;
  voice: string;
  speed: number;
  projectId: number;
  publicRoot: string;
}): Promise<{ url: string; durationSec: number; segments: number; provider: string }> {
  const clean = cleanForTTS(opts.scriptText);
  if (!clean) throw new Error("Script has no narration text to synthesize");

  const chunks = splitIntoChunks(clean);
  const outDir = path.join(opts.publicRoot, "gen", String(opts.projectId));
  fs.mkdirSync(outDir, { recursive: true });

  const segPaths: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const buf = await ttsChunk(chunks[i], opts.voice, opts.speed);
    const p = path.join(outDir, `_seg_${i}.wav`);
    fs.writeFileSync(p, buf);
    segPaths.push(p);
  }

  const finalPath = path.join(outDir, "voiceover.wav");
  if (segPaths.length === 1) {
    fs.copyFileSync(segPaths[0], finalPath);
  } else {
    const list = path.join(outDir, "_concat.txt");
    fs.writeFileSync(
      list,
      segPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
    );
    await execFileP("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", finalPath,
    ]);
  }
  for (const p of segPaths) fs.unlinkSync(p);
  fs.unlink(path.join(outDir, "_concat.txt"), () => {});

  let durationSec = 0;
  try {
    const { stdout } = await execFileP("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", finalPath,
    ]);
    durationSec = Math.round(parseFloat(stdout.trim()) || 0);
  } catch {
    /* ffprobe optional */
  }

  return {
    url: `/gen/${opts.projectId}/voiceover.wav`,
    durationSec,
    segments: chunks.length,
    provider: await ttsProvider(),
  };
}
