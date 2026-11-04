import { chat } from "./provider";
import type { Project } from "@/lib/types";

/* ---------------------------------------------------------------------------
   Phase 5 content generation. Each LLM task returns STRICT JSON; extractJSON
   tolerates ```json fences and surrounding prose. Subtitles are generated
   deterministically (cue timing from the narration word count).
--------------------------------------------------------------------------- */

export function extractJSON<T = unknown>(text: string): T | null {
  if (!text) return null;
  let t = text.trim();
  // strip ```json ... ``` or ``` ... ``` fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // find the first { or [ and try to balance to the end
  const start = t.search(/[{[]/);
  if (start === -1) return null;
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(t.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

const SYS = (role: string) =>
  `You are ${role}. You ALWAYS reply with a single valid JSON object and nothing else — no markdown, no commentary. Follow the requested schema exactly.`;

/* ---------- 1. Topic research ---------- */
export type Research = {
  summary: string;
  keyPoints: string[];
  trends: string[];
  hookAngles: string[];
  audience: string;
};
export async function researchTopic(topic: string, niche: string): Promise<Research> {
  const raw = await chat(
    SYS("a senior YouTube content researcher"),
    `Topic: "${topic}". Niche: ${niche}.
Return JSON: {"summary": string (2-3 sentences), "keyPoints": string[5], "trends": string[3], "hookAngles": string[3], "audience": string}.`
  );
  const j = extractJSON<Record<string, unknown>>(raw);
  if (!j) throw new Error("Research generation failed (no JSON)");
  const arr = (v: unknown) => Array.isArray(v) ? (v as string[]) : [];
  return {
    summary: String(j.summary || ""),
    keyPoints: arr(j.keyPoints || (j as { key_points?: string[] }).key_points),
    trends: arr(j.trends),
    hookAngles: arr(j.hookAngles || (j as { hook_angles?: string[] }).hook_angles),
    audience: String(j.audience || ""),
  };
}

/* ---------- 2. Idea generation ---------- */
export type Idea = { title: string; angle: string; format: string; whyItWorks: string };
export type Ideas = { ideas: Idea[] };
export async function generateIdeas(
  topic: string,
  niche: string,
  count = 5
): Promise<Ideas> {
  const raw = await chat(
    SYS("a viral short-form video strategist"),
    `Generate ${count} distinct video ideas about "${topic}" in the ${niche} niche.
Return JSON: {"ideas":[{"title": string, "angle": string, "format": "16-9"|"9-16"|"1-1", "whyItWorks": string}]}.`
  );
  const j = extractJSON<{ ideas: Idea[] }>(raw);
  if (!j) throw new Error("Idea generation failed (no JSON)");
  return {
    ideas: (j.ideas || []).map((i) => ({
      title: i.title,
      angle: i.angle,
      format: i.format || "16-9",
      whyItWorks: i.whyItWorks || (i as { why_it_works?: string }).why_it_works || "",
    })),
  };
}

/* ---------- 3. Story outline ---------- */
export type OutlineSection = { label: string; beats: string[] };
export type Outline = { logline: string; sections: OutlineSection[] };
export async function generateOutline(p: Project): Promise<Outline> {
  const raw = await chat(
    SYS("a narrative designer for short-form video"),
    `Create a story outline. Title: "${p.title}". Topic: "${p.topic}". Niche: ${p.niche}. Tone: ${p.tone}. Target length: ${p.targetLength}. Language: ${p.language}.
Return JSON: {"logline": string (one sentence), "sections":[{"label":"HOOK"|"BODY"|"CTA", "beats": string[2-5]}]}. Include exactly one HOOK, 1-3 BODY sections, one CTA.`
  );
  const j = extractJSON<Outline>(raw);
  if (!j) throw new Error("Outline generation failed (no JSON)");
  return { logline: j.logline || "", sections: j.sections || [] };
}

/* ---------- 4. Scene-by-scene script ---------- */
export type Scene = { index: number; heading: string; narration: string; visualHint: string };
export type ScriptGen = {
  title: string;
  hook: string;
  scenes: Scene[];
  cta: string;
  scriptText: string;
};
export async function generateScript(p: Project): Promise<ScriptGen> {
  const raw = await chat(
    SYS("an expert YouTube scriptwriter"),
    `Write a scene-by-scene narration script. Title: "${p.title}". Topic: "${p.topic}". Niche: ${p.niche}. Tone: ${p.tone}. Format: ${p.format}. Target length: ${p.targetLength}. Language: ${p.language}.
The narration must read naturally aloud (TTS-friendly, short sentences, no symbols like # or @).
Return JSON: {"title": string, "hook": string (1-2 sentences, attention-grabbing opener), "scenes": [{"index": number, "heading": string, "narration": string (2-4 sentences), "visual_hint": string}], "cta": string}. Use 3 to 6 scenes.`
  );
  const j = extractJSON<{ title: string; hook: string; scenes: Scene[]; cta: string }>(raw);
  if (!j) throw new Error("Script generation failed (no JSON)");
  const scenes = (j.scenes || []).map((s, i) => ({
    index: s.index ?? i + 1,
    heading: s.heading || `Scene ${i + 1}`,
    narration: s.narration || "",
    visualHint: s.visualHint || "",
  }));
  const scriptText = composeScriptText(j.title || p.title, j.hook || "", scenes, j.cta || "");
  return { title: j.title || p.title, hook: j.hook || "", scenes, cta: j.cta || "", scriptText };
}

export function composeScriptText(
  title: string,
  hook: string,
  scenes: Scene[],
  cta: string
): string {
  const body = scenes
    .map((s) => `Scene ${s.index} — ${s.heading}\n${s.narration}`)
    .join("\n\n");
  return `[HOOK]\n${hook}\n\n[BODY]\n${body}\n\n[CTA]\n${cta}`.trim();
}

/* ---------- 5. Dialogue & narration breakdown ---------- */
export type Dialogue = { narration: string[]; dialogue: { speaker: string; line: string }[] };
export async function generateDialogue(scriptText: string): Promise<Dialogue> {
  const raw = await chat(
    SYS("a narration director"),
    `Given this narration script, split it into a TTS-ready narration track and (if present) any multi-speaker dialogue.
Script:
"""
${scriptText.slice(0, 3500)}
"""
Return JSON: {"narration": string[] (short spoken segments, ready for text-to-speech), "dialogue": [{"speaker": string, "line": string}]}. If the video is single-narrator, return an empty dialogue array.`
  );
  const j = extractJSON<Dialogue>(raw);
  if (!j) throw new Error("Dialogue generation failed (no JSON)");
  return { narration: j.narration || [], dialogue: j.dialogue || [] };
}

/* ---------- 6. Image prompts (per scene) ---------- */
export type ImagePrompt = { scene: string; prompt: string; style: string };
export type ImagePrompts = { prompts: ImagePrompt[] };
export async function generateImagePrompts(
  scriptText: string,
  format: string,
  niche: string
): Promise<ImagePrompts> {
  const raw = await chat(
    SYS("an AI image prompt engineer"),
    `From this video script, write one vivid image-generation prompt per scene/section.
Niche: ${niche}. Aspect: ${format}.
Script:
"""
${scriptText.slice(0, 3500)}
"""
Return JSON: {"prompts":[{"scene": string, "prompt": string (subject, style, lighting, mood — no readable text in the image), "style": string}]}. 3 to 6 prompts.`
  );
  const j = extractJSON<ImagePrompts>(raw);
  if (!j) throw new Error("Image prompt generation failed (no JSON)");
  return { prompts: j.prompts || [] };
}

/* ---------- 7. Subtitles (deterministic cueing) ---------- */
export type SubtitleCue = { index: number; start: number; end: number; text: string };
export type Subtitles = { cues: SubtitleCue[]; srt: string; language: string };
const WORDS_PER_MINUTE = 150;
const WORDS_PER_CUE = 7;

function fmtSrtTime(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const s = Math.floor(sec) % 60;
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)},${String(ms).padStart(3, "0")}`;
}

export function generateSubtitles(
  scriptText: string,
  narrationSpeed: number,
  language = "en-US"
): Subtitles {
  const body = scriptText.replace(/\[[^\]]+\]/g, " ").replace(/\s+/g, " ").trim();
  const words = body ? body.split(" ").filter(Boolean) : [];
  const secPerWord = 60 / (WORDS_PER_MINUTE * Math.max(narrationSpeed, 0.1));
  const cues: SubtitleCue[] = [];
  let t = 0;
  let idx = 1;
  for (let i = 0; i < words.length; i += WORDS_PER_CUE) {
    const chunk = words.slice(i, i + WORDS_PER_CUE).join(" ");
    const dur = chunk.split(" ").length * secPerWord;
    cues.push({ index: idx, start: t, end: t + dur, text: chunk });
    t += dur;
    idx++;
  }
  const srt = cues
    .map((c) => `${c.index}\n${fmtSrtTime(c.start)} --> ${fmtSrtTime(c.end)}\n${c.text}\n`)
    .join("\n");
  return { cues, srt, language };
}
