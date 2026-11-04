import path from "path";
import fs from "fs";
import { db } from "@/lib/db";
import { runFF, durationSec } from "./ffmpeg";
import { updateJob, appendJobLog } from "./jobs";
import { getArtifacts, saveArtifact } from "../ai/artifacts";
import {
  generateScript, generateImagePrompts, generateSubtitles,
} from "../ai/generate";
import { synthesizeVoiceover } from "../ai/tts";
import { generateImage } from "../ai/provider";
import { computeMetrics } from "@/lib/seed";
import type { Project } from "@/lib/types";

/* Output video size (render target) and the z-ai-supported image size to generate at. */
const VIDEO_SIZE: Record<string, string> = { "16-9": "1280x720", "9-16": "720x1280", "1-1": "1080x1080" };
const IMG_SIZE: Record<string, string> = { "16-9": "1344x768", "9-16": "720x1440", "1-1": "1024x1024" };

function voiceFor(voice: string): string {
  if (voice.includes("female")) return "tongtong";
  if (voice.includes("male")) return "jam";
  return "tongtong";
}
function fmtSrt(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const s = Math.floor(sec) % 60;
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)},${String(ms).padStart(3, "0")}`;
}

const publicRoot = () => path.join(process.cwd(), "public");
const genDir = (id: number) => path.join(publicRoot(), "gen", String(id));

/** Full video production pipeline. Runs as a background task and updates job state. */
export async function produceVideo(jobId: string, project: Project): Promise<void> {
  const id = project.id;
  const dir = genDir(id);
  const scenesDir = path.join(dir, "scenes");
  fs.mkdirSync(scenesDir, { recursive: true });
  const log = (m: string) => appendJobLog(jobId, m);
  const set = (stage: Parameters<typeof updateJob>[1]["stage"], progress: number) =>
    updateJob(jobId, { stage, progress });

  try {
    /* ---- 1. Prerequisites: ensure Phase 5 artefacts exist ---- */
    set("prereq", 5);
    log("Resolving prerequisites…");
    let arts = await getArtifacts(id);
    const art = (k: string): any => arts.find((a) => a.kind === k)?.content;

    let scriptScenes = art("script_scenes");
    if (!scriptScenes) {
      log("Generating script…");
      const sg = await generateScript(project);
      const m = computeMetrics(sg.scriptText, project.narrationSpeed);
      await db.script.upsert({
        where: { projectId: id },
        update: { content: sg.scriptText, ...m, version: { increment: 1 } },
        create: { projectId: id, content: sg.scriptText, ...m },
      });
      scriptScenes = { title: sg.title, hook: sg.hook, scenes: sg.scenes, cta: sg.cta };
      await saveArtifact(id, "script_scenes", scriptScenes);
    }

    let imagePrompts = art("image_prompts");
    if (!imagePrompts) {
      log("Generating image prompts…");
      const row = await db.script.findUnique({ where: { projectId: id } });
      imagePrompts = await generateImagePrompts(row?.content || "", project.format, project.niche);
      await saveArtifact(id, "image_prompts", imagePrompts);
    }

    const voiceoverPath = path.join(dir, "voiceover.wav");
    const voArt = arts.find((a) => a.kind === "voiceover");
    if (!voArt || !fs.existsSync(voiceoverPath)) {
      log("Synthesizing voiceover…");
      const row = await db.script.findUnique({ where: { projectId: id } });
      const r = await synthesizeVoiceover({
        scriptText: row?.content || "",
        voice: voiceFor(project.voice),
        speed: project.narrationSpeed,
        projectId: id,
        publicRoot: publicRoot(),
      });
      await saveArtifact(id, "voiceover", { durationSec: r.durationSec, segments: r.segments, provider: r.provider, voice: project.voice }, r.url);
    }

    let subtitles = art("subtitles");
    if (!subtitles) {
      log("Generating subtitles…");
      const row = await db.script.findUnique({ where: { projectId: id } });
      subtitles = generateSubtitles(row?.content || "", project.narrationSpeed, project.language);
      await saveArtifact(id, "subtitles", subtitles);
    }

    const scenes: any[] = scriptScenes.scenes || [];
    if (!scenes.length) throw new Error("No scenes available to render");
    const totalDur = (await durationSec(voiceoverPath)) || scenes.length * 5;
    log(`Voiceover duration: ${Math.round(totalDur)}s across ${scenes.length} scenes`);

    /* ---- 2. Per-scene images (up to 4 distinct, rest reuse) ---- */
    set("images", 20);
    const prompts: any[] = imagePrompts.prompts || [];
    const imgSize = IMG_SIZE[project.format] || "1344x768";
    const maxImgs = Math.min(scenes.length, 4);
    const imgPaths: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const p = path.join(scenesDir, `scene${i}.png`);
      if (!fs.existsSync(p)) {
        const po = prompts[Math.min(i, prompts.length - 1)] || prompts[0];
        const prompt =
          po?.prompt ||
          `${project.niche} scene: ${scenes[i].heading}. ${scenes[i].visualHint}. Cinematic, high quality, no text`;
        if (i < maxImgs) {
          log(`Generating scene image ${i + 1}/${maxImgs}…`);
          const buf = await generateImage(prompt, imgSize);
          fs.writeFileSync(p, buf);
        } else {
          fs.copyFileSync(path.join(scenesDir, `scene${maxImgs - 1}.png`), p);
        }
      }
      imgPaths.push(p);
    }

    /* ---- 3. Background music bed (3-tone chord, soft) ---- */
    set("music", 35);
    const musicPath = path.join(dir, "music.wav");
    if (!fs.existsSync(musicPath)) {
      log("Generating background music…");
      await runFF(
        [
          "-f", "lavfi", "-i", `sine=f=220:d=${totalDur}`,
          "-f", "lavfi", "-i", `sine=f=277.18:d=${totalDur}`,
          "-f", "lavfi", "-i", `sine=f=329.63:d=${totalDur}`,
          "-filter_complex",
          "[0][1][2]amix=inputs=3,tremolo=f=0.4:d=0.3,lowpass=f=500,volume=0.25",
          musicPath,
        ],
        "music"
      );
    }

    /* ---- 4. Per-scene Ken Burns clips with fades ---- */
    set("clips", 45);
    const [W, H] = (VIDEO_SIZE[project.format] || "1280x720").split("x").map(Number);
    const fps = 30;
    const words = scenes.map((s) => (s.narration || "").split(/\s+/).filter(Boolean).length);
    const totalWords = words.reduce((a, b) => a + b, 0) || scenes.length;
    const sceneDur = scenes.map((_, i) => Math.max(1.2, totalDur * (words[i] / totalWords)));
    const clipPaths: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const cp = path.join(scenesDir, `clip${i}.mp4`);
      const d = sceneDur[i];
      const fadeOutSt = Math.max(0, d - 0.3);
      log(`Rendering clip ${i + 1}/${scenes.length} (${d.toFixed(1)}s)…`);
      await runFF(
        [
          "-framerate", String(fps), "-loop", "1", "-t", String(d), "-i", imgPaths[i],
          "-vf",
          `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},` +
          `zoompan=z='min(zoom+0.0006,1.15)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H},` +
          `fade=t=in:st=0:d=0.3,fade=t=out:st=${fadeOutSt}:d=0.3,format=yuv420p`,
          "-c:v", "libx264", "-preset", "ultrafast", "-r", String(fps), cp,
        ],
        `clip${i}`
      );
      clipPaths.push(cp);
      set("clips", 45 + Math.round(((i + 1) / scenes.length) * 10));
    }

    /* ---- 5. Concatenate clips → visual track ---- */
    set("concat", 60);
    const listPath = path.join(scenesDir, "list.txt");
    fs.writeFileSync(listPath, clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
    const visualPath = path.join(dir, "visual.mp4");
    try {
      await runFF(["-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", visualPath], "concat-copy");
    } catch {
      log("Concat copy failed, re-encoding…");
      await runFF(["-f", "concat", "-safe", "0", "-i", listPath, "-c:v", "libx264", "-preset", "ultrafast", visualPath], "concat-enc");
    }

    /* ---- 6. Audio: voiceover + music (music low) ---- */
    set("audio", 70);
    const audioPath = path.join(dir, "audio.wav");
    await runFF(
      ["-i", voiceoverPath, "-i", musicPath,
        "-filter_complex", "[1:a]volume=0.6[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]",
        "-map", "[a]", "-c:a", "pcm_s16le", audioPath],
      "audio-mix"
    );

    /* ---- 7. Rescale subtitles to actual audio duration + burn in ---- */
    set("mux", 78);
    const cues: any[] = subtitles.cues || [];
    const cuesEnd = cues.length ? cues[cues.length - 1].end : totalDur;
    const scl = totalDur / (cuesEnd || totalDur);
    const srtPath = path.join(dir, "subtitles.srt");
    fs.writeFileSync(
      srtPath,
      cues
        .map((c) => `${c.index}\n${fmtSrt(c.start * scl)} --> ${fmtSrt(c.end * scl)}\n${c.text}\n`)
        .join("\n")
    );
    log("Muxing final video with subtitles…");
    const longPath = path.join(dir, "video-long.mp4");
    await runFF(
      ["-i", visualPath, "-i", audioPath,
        "-vf", `subtitles=${srtPath}`,
        "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", "-b:a", "128k",
        "-shortest", longPath],
      "mux-long"
    );

    /* ---- 8. Short version: vertical 720x1280, ≤60s ---- */
    set("short", 92);
    const shortDur = Math.min(60, totalDur);
    const shortPath = path.join(dir, "video-short.mp4");
    await runFF(
      ["-i", longPath, "-t", String(shortDur),
        "-vf",
        `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,` +
        `fade=t=in:st=0:d=0.3,fade=t=out:st=${Math.max(0, shortDur - 0.3)}:d=0.3`,
        "-c:a", "aac", "-b:a", "128k", shortPath],
      "short"
    );

    /* ---- 9. Done ---- */
    const longUrl = `/gen/${id}/video-long.mp4`;
    const shortUrl = `/gen/${id}/video-short.mp4`;
    await saveArtifact(id, "video", {
      longUrl, shortUrl, durationSec: Math.round(totalDur), scenes: scenes.length,
      format: project.format, size: VIDEO_SIZE[project.format],
    }, longUrl);
    await db.workflowRun.create({
      data: { projectId: id, stage: "render", status: "done", progress: 100, startedAt: new Date(), finishedAt: new Date() },
    });
    updateJob(jobId, {
      status: "done", stage: "done", progress: 100,
      longUrl, shortUrl, durationSec: Math.round(totalDur), scenes: scenes.length,
      finishedAt: Date.now(),
    });
    log(`Done — long ${Math.round(totalDur)}s, short ${Math.round(shortDur)}s.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    appendJobLog(jobId, `ERROR: ${msg}`);
    updateJob(jobId, { status: "failed", stage: "failed", error: msg, finishedAt: Date.now() });
  }
}
