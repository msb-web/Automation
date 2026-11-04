import { execFile } from "child_process";
import fs from "fs";

/* ---------------------------------------------------------------------------
   AI provider layer (Phase 5)
   - Primary: Ollama (LLM, HTTP) and Piper (TTS, subprocess) — real integrations
     that activate automatically when the service/binary is present.
   - Fallback: the in-process z-ai-web-dev-sdk, so generation works in any
     environment (including this sandbox, where Ollama/Piper are not installed).
   - Image generation always uses the z-ai SDK (no local equivalent wired here).
--------------------------------------------------------------------------- */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";
const PIPER_MODEL = process.env.PIPER_MODEL || ""; // path to a Piper .onnx voice model

// Lazily-created SDK singleton (the SDK initialises credentials on first use).
let _zai: any = null;
async function getZAI() {
  if (!_zai) {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    _zai = await ZAI.create();
  }
  return _zai;
}

/* ---------- provider detection (cached per process) ---------- */
let _llm: "ollama" | "z-ai" | null = null;
let _tts: "piper" | "z-ai" | null = null;

async function probeOllama(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: ctrl.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

function probePiper(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("piper", ["--help"], (err) => resolve(!err && !!PIPER_MODEL));
  });
}

export async function llmProvider(): Promise<"ollama" | "z-ai"> {
  if (!_llm) _llm = (await probeOllama()) ? "ollama" : "z-ai";
  return _llm;
}
export async function ttsProvider(): Promise<"piper" | "z-ai"> {
  if (!_tts) _tts = (await probePiper()) ? "piper" : "z-ai";
  return _tts;
}

export async function providerInfo() {
  return {
    llm: await llmProvider(),
    tts: await ttsProvider(),
    image: "z-ai" as const,
    ollamaUrl: OLLAMA_URL,
    ollamaModel: OLLAMA_MODEL,
    piperModel: PIPER_MODEL || "(not configured)",
  };
}

/* ---------- LLM chat ---------- */
export async function chat(system: string, user: string): Promise<string> {
  if ((await llmProvider()) === "ollama") {
    try {
      const r = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          stream: false,
        }),
      });
      if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
      const d = await r.json();
      const c = d?.message?.content;
      if (typeof c === "string" && c.trim()) return c;
      throw new Error("Ollama returned empty content");
    } catch {
      _llm = "z-ai"; // fall back for the rest of this process
    }
  }
  const zai = await getZAI();
  const r = await zai.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return r?.choices?.[0]?.message?.content ?? "";
}

/* ---------- TTS (one chunk ≤1024 chars) → WAV Buffer ---------- */
export async function ttsChunk(
  text: string,
  voice: string,
  speed: number
): Promise<Buffer> {
  const prov = await ttsProvider();
  if (prov === "piper") {
    // Real Piper integration: pipes text to stdin, writes a WAV to disk.
    const out = `/tmp/piper-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
    await new Promise<void>((resolve, reject) => {
      const p = execFile(
        "piper",
        ["--model", PIPER_MODEL, "--output_file", out],
        (err) => (err ? reject(err) : resolve())
      );
      p.stdin?.end(text);
    });
    const buf = fs.readFileSync(out);
    fs.unlinkSync(out);
    return buf;
  }
  const zai = await getZAI();
  const r = await zai.audio.tts.create({
    input: text.slice(0, 1000),
    voice,
    speed,
    response_format: "wav",
    stream: false,
  });
  const ab = await r.arrayBuffer();
  return Buffer.from(new Uint8Array(ab));
}

/* ---------- Image generation → PNG Buffer ---------- */
export async function generateImage(prompt: string, size: string): Promise<Buffer> {
  const zai = await getZAI();
  const r = await zai.images.generations.create({ prompt, size });
  const b64 = r?.data?.[0]?.base64;
  if (!b64) throw new Error("Image generation returned no data");
  return Buffer.from(b64, "base64");
}
