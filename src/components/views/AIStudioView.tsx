"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Wand2, Search, Lightbulb, ListTree, FileText, Mic2, Captions,
  ImageIcon, AudioLines, Palette, Sparkles, Loader2, ArrowRight, Download,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { fmtFormat } from "@/lib/types";
import { Card, CardHead, StatusPill } from "../app/shared";

type Providers = { llm: string; tts: string; image: string; ollamaUrl: string; ollamaModel: string; piperModel: string };
type Artifact = { kind: string; content: any; assetUrl: string | null };

const KIND_LABEL: Record<string, string> = {
  research: "Topic Research",
  ideas: "Idea Generation",
  outline: "Story Outline",
  script_scenes: "Scene-by-Scene Script",
  dialogue: "Dialogue & Narration",
  subtitles: "Subtitles (SRT)",
  image_prompts: "Image Prompts",
  voiceover: "Voiceover",
  thumbnail: "Thumbnail",
};

export function AIStudioView({
  projects,
  currentProjectId,
  setCurrentProjectId,
  refresh,
  nav,
}: {
  projects: Project[];
  currentProjectId: number | null;
  setCurrentProjectId: (id: number) => void;
  refresh: () => Promise<void>;
  nav: (v: string) => void;
}) {
  const [providers, setProviders] = useState<Providers | null>(null);
  const [artifacts, setArtifacts] = useState<Record<string, Artifact>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<string[]>([]);

  const projectId = currentProjectId ?? projects[0]?.id ?? null;
  const project = projects.find((p) => p.id === projectId) || null;

  useEffect(() => {
    api.get<Providers>("/api/ai/providers").then(setProviders).catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancel = false;
    (async () => {
      try {
        const rows = await api.get<Artifact[]>(`/api/projects/${projectId}/artifacts`);
        if (cancel) return;
        const map: Record<string, Artifact> = {};
        for (const r of rows) map[r.kind] = r;
        setArtifacts(map);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [projectId]);

  const genUrl = (kind: string) =>
    kind === "voiceover"
      ? `/api/projects/${projectId}/voiceover`
      : kind === "thumbnail"
        ? `/api/projects/${projectId}/thumbnail`
        : `/api/projects/${projectId}/ai/${kind}`;

  const run = useCallback(
    async (kind: string, label?: string) => {
      if (!projectId) return;
      setBusy(kind);
      try {
        const res = await api.post<{ kind?: string; content: any }>(genUrl(kind));
        // script/thumbnail/voiceover return the payload directly; ai/[kind] wraps in {kind, content}
        const content = (res as any).content ?? res;
        setArtifacts((prev) => ({
          ...prev,
          [kind === "script" ? "script_scenes" : kind]: { kind, content, assetUrl: (res as any).url ?? null },
        }));
        toast.success(`${label || KIND_LABEL[kind === "script" ? "script_scenes" : kind]} ready`);
        if (kind === "script") await refresh(); // script model changed
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${kind} failed`);
      } finally {
        setBusy(null);
      }
    },
    [projectId, genUrl, refresh]
  );

  const PIPELINE = [
    ["outline", "Outline"],
    ["script", "Script"],
    ["subtitles", "Subtitles"],
    ["image-prompts", "Image prompts"],
    ["voiceover", "Voiceover"],
    ["thumbnail", "Thumbnail"],
  ] as const;

  async function runPipeline() {
    if (!projectId) return;
    setPipeline([]);
    for (const [kind, label] of PIPELINE) {
      setPipeline((p) => [...p, label]);
      setBusy(kind);
      try {
        const res = await api.post<{ content: any }>(genUrl(kind));
        const content = (res as any).content ?? res;
        setArtifacts((prev) => ({
          ...prev,
          [kind === "script" ? "script_scenes" : kind]: { kind, content, assetUrl: (res as any).url ?? null },
        }));
        if (kind === "script") await refresh();
      } catch (e) {
        toast.error(`${label} failed: ${e instanceof Error ? e.message : ""} — pipeline stopped`);
        setBusy(null);
        setPipeline([]);
        return;
      }
    }
    setBusy(null);
    setPipeline([]);
    toast.success("Full content pipeline complete 🎬");
  }

  if (!projects.length) {
    return <Card><p className="py-8 text-center text-muted-foreground">Create a project first to use the AI Studio.</p></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Header: provider badge + project select */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Wand2 className="h-5 w-5 text-[#a78bfa]" />
          <div>
            <div className="text-sm font-bold">AI Content Generation</div>
            <div className="text-xs text-muted-foreground">Ollama · Piper · z-ai — auto-detected</div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {providers && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-[#0e1119] px-2.5 py-1.5 text-[11px]">
                <Pill label="LLM" value={providers.llm} ok={providers.llm === "ollama"} />
                <Pill label="TTS" value={providers.tts} ok={providers.tts === "piper"} />
                <Pill label="Image" value={providers.image} ok={false} />
              </div>
            )}
            <select
              value={projectId ?? ""}
              onChange={(e) => setCurrentProjectId(Number(e.target.value))}
              className="rounded-lg border border-border bg-[#0e1119] px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            {project && <StatusPill status={project.status} />}
          </div>
        </div>
        {providers && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Active: LLM <b className="text-foreground">{providers.llm}</b>
            {providers.llm === "ollama" ? ` (${providers.ollamaModel} @ ${providers.ollamaUrl})` : " (z-ai-web-dev-sdk)"}
            , TTS <b className="text-foreground">{providers.tts}</b>
            {providers.tts === "piper" ? ` (${providers.piperModel})` : " (z-ai, chunked + ffmpeg concat)"}
            . Ollama/Piper activate automatically when installed.
          </p>
        )}
      </Card>

      {/* Full pipeline */}
      <Card className="border-[#7c3aed]/40 bg-grad-soft">
        <div className="flex flex-wrap items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#a78bfa]" />
          <div className="flex-1">
            <div className="text-sm font-bold">Generate full content pipeline</div>
            <div className="text-xs text-muted-foreground">Outline → Script → Subtitles → Image prompts → Voiceover → Thumbnail</div>
          </div>
          {pipeline.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE.map(([, label]) => (
                <span key={label} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${pipeline.includes(label) ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-muted text-muted-foreground"}`}>
                  {pipeline.includes(label) ? "✓" : "·"} {label}
                </span>
              ))}
            </div>
          ) : (
            <button onClick={runPipeline} disabled={!!busy} className="flex items-center gap-2 rounded-lg bg-grad px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Run pipeline
            </button>
          )}
        </div>
      </Card>

      {/* Generation cards grid */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <GenCard kind="research" icon={<Search className="h-4 w-4" />} desc="Key points, trends & hook angles" busy={busy} onRun={run} artifact={artifacts.research}>
          {artifacts.research && <ResearchView c={artifacts.research.content} />}
        </GenCard>
        <GenCard kind="ideas" icon={<Lightbulb className="h-4 w-4" />} desc="Distinct video angles" busy={busy} onRun={run} artifact={artifacts.ideas}>
          {artifacts.ideas && <IdeasView c={artifacts.ideas.content} />}
        </GenCard>
        <GenCard kind="outline" icon={<ListTree className="h-4 w-4" />} desc="Logline + HOOK/BODY/CTA beats" busy={busy} onRun={run} artifact={artifacts.outline}>
          {artifacts.outline && <OutlineView c={artifacts.outline.content} />}
        </GenCard>
        <GenCard kind="script" icon={<FileText className="h-4 w-4" />} desc="Scene-by-scene narration (TTS-ready)" busy={busy} onRun={run} artifact={artifacts.script_scenes}
          extra={artifacts.script_scenes && <button onClick={() => nav("editor")} className="flex items-center gap-1 text-xs text-[#2563eb] hover:underline">Open in editor <ArrowRight className="h-3 w-3" /></button>}>
          {artifacts.script_scenes && <ScriptView c={artifacts.script_scenes.content} />}
        </GenCard>
        <GenCard kind="dialogue" icon={<Mic2 className="h-4 w-4" />} desc="Narration track + dialogue" busy={busy} onRun={run} artifact={artifacts.dialogue}>
          {artifacts.dialogue && <DialogueView c={artifacts.dialogue.content} />}
        </GenCard>
        <GenCard kind="subtitles" icon={<Captions className="h-4 w-4" />} desc="Timed SRT cues" busy={busy} onRun={run} artifact={artifacts.subtitles}
          extra={artifacts.subtitles && <CopySrt srt={artifacts.subtitles.content.srt} />}>
          {artifacts.subtitles && <SubtitlesView c={artifacts.subtitles.content} />}
        </GenCard>
        <GenCard kind="image-prompts" icon={<ImageIcon className="h-4 w-4" />} desc="Per-scene image prompts" busy={busy} onRun={run} artifact={artifacts.image_prompts}>
          {artifacts.image_prompts && <ImagePromptsView c={artifacts.image_prompts.content} />}
        </GenCard>
        <GenCard kind="voiceover" icon={<AudioLines className="h-4 w-4" />} desc="Piper / z-ai narration audio" busy={busy} onRun={run} artifact={artifacts.voiceover}>
          {artifacts.voiceover && artifacts.voiceover.assetUrl && <VoiceoverView a={artifacts.voiceover} />}
        </GenCard>
        <GenCard kind="thumbnail" icon={<Palette className="h-4 w-4" />} desc="AI-generated thumbnail art" busy={busy} onRun={run} artifact={artifacts.thumbnail}>
          {artifacts.thumbnail && artifacts.thumbnail.assetUrl && <ThumbnailView a={artifacts.thumbnail} />}
        </GenCard>
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */
function Pill({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <span className={`rounded px-1.5 py-0.5 font-bold ${ok ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-[#2563eb]/15 text-[#60a5fa]"}`}>
      {label}:{value}
    </span>
  );
}

function GenCard({
  kind, icon, desc, busy, onRun, artifact, extra, children,
}: {
  kind: string; icon: React.ReactNode; desc: string; busy: string | null;
  onRun: (kind: string, label?: string) => void; artifact?: Artifact;
  extra?: React.ReactNode; children?: React.ReactNode;
}) {
  const label = KIND_LABEL[kind === "script" ? "script_scenes" : kind] || kind;
  const isBusy = busy === kind;
  return (
    <Card className="flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c3aed]/15 text-[#a78bfa]">{icon}</div>
          <div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-[11px] text-muted-foreground">{desc}</div>
          </div>
        </div>
        {artifact && <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-bold text-[#22c55e]">✓ saved</span>}
      </div>
      <div className="mb-3 min-h-[40px] flex-1 text-xs text-muted-foreground">
        {children || <span className="opacity-60">Not generated yet.</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRun(kind, label)}
          disabled={!!busy}
          className="flex items-center gap-1.5 rounded-lg border border-[#7c3aed]/50 bg-[#7c3aed]/10 px-3 py-1.5 text-xs font-semibold text-[#a78bfa] transition hover:bg-[#7c3aed]/20 disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {artifact ? "Regenerate" : "Generate"}
        </button>
        {extra}
      </div>
    </Card>
  );
}

/* ---------- result renderers ---------- */
function BulletList({ items }: { items: string[] }) {
  return <ul className="ml-4 list-disc space-y-1">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}
function ResearchView({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      <p className="text-foreground/90">{c.summary}</p>
      {c.keyPoints?.length > 0 && <div><b>Key points:</b> <BulletList items={c.keyPoints} /></div>}
      {c.hookAngles?.length > 0 && <div><b>Hooks:</b> <BulletList items={c.hookAngles} /></div>}
      {c.audience && <div><b>Audience:</b> {c.audience}</div>}
    </div>
  );
}
function IdeasView({ c }: { c: any }) {
  return (
    <div className="space-y-1.5">
      {(c.ideas || []).slice(0, 4).map((i: any, k: number) => (
        <div key={k} className="rounded-lg border border-border/60 bg-[#0e1119] p-2">
          <div className="font-semibold text-foreground/90">{i.title}</div>
          <div className="text-[11px] text-muted-foreground">{i.angle} · {fmtFormat(i.format)}</div>
        </div>
      ))}
    </div>
  );
}
function OutlineView({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      <p className="italic text-foreground/90">“{c.logline}”</p>
      {(c.sections || []).map((s: any, k: number) => (
        <div key={k}>
          <b className="text-[#a78bfa]">{s.label}</b>
          <BulletList items={s.beats || []} />
        </div>
      ))}
    </div>
  );
}
function ScriptView({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      <p><b>Hook:</b> {c.hook}</p>
      {(c.scenes || []).map((s: any, k: number) => (
        <div key={k} className="rounded-lg border border-border/60 bg-[#0e1119] p-2">
          <div className="font-semibold text-foreground/90">Scene {s.index} — {s.heading}</div>
          <div className="text-foreground/80">{s.narration}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">🎨 {s.visualHint}</div>
        </div>
      ))}
      <p><b>CTA:</b> {c.cta}</p>
    </div>
  );
}
function DialogueView({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      {c.narration?.length > 0 && (
        <div><b>Narration segments ({c.narration.length}):</b>
          <ul className="ml-4 list-decimal space-y-0.5">{c.narration.slice(0, 4).map((n: string, k: number) => <li key={k}>{n.slice(0, 90)}{n.length > 90 ? "…" : ""}</li>)}</ul>
        </div>
      )}
      {c.dialogue?.length > 0 && (
        <div>
          <b>Dialogue:</b>{" "}
          {c.dialogue.map((d: any, k: number) => (
            <span key={k} className="mr-1 text-foreground/80">
              {`${d.speaker}: “${d.line}”. `}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
function SubtitlesView({ c }: { c: any }) {
  const cues = c.cues || [];
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground">{cues.length} cues · {c.language}</div>
      <div className="max-h-40 overflow-y-auto scrollbar-thin">
        <table className="w-full text-[11px]">
          <tbody>
            {cues.slice(0, 12).map((q: any) => (
              <tr key={q.index} className="border-b border-border/40">
                <td className="py-0.5 pr-2 font-mono text-muted-foreground">{fmtT(q.start)}→{fmtT(q.end)}</td>
                <td className="py-0.5 text-foreground/80">{q.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function CopySrt({ srt }: { srt: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(srt); toast.success("SRT copied to clipboard"); }}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Download className="h-3 w-3" /> Copy SRT
    </button>
  );
}
function ImagePromptsView({ c }: { c: any }) {
  return (
    <div className="space-y-1.5">
      {(c.prompts || []).slice(0, 4).map((p: any, k: number) => (
        <div key={k} className="rounded-lg border border-border/60 bg-[#0e1119] p-2">
          <div className="font-semibold text-foreground/90">{p.scene} <span className="text-[11px] text-muted-foreground">· {p.style}</span></div>
          <div className="text-foreground/70">{p.prompt}</div>
        </div>
      ))}
    </div>
  );
}
function VoiceoverView({ a }: { a: Artifact }) {
  const c = a.content;
  return (
    <div className="space-y-2">
      <audio controls src={a.assetUrl!} className="w-full h-8" />
      <div className="text-[11px] text-muted-foreground">
        {c.durationSec ? `${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, "0")}` : "—"} · {c.segments} segment(s) · {c.provider}
      </div>
    </div>
  );
}
function ThumbnailView({ a }: { a: Artifact }) {
  const c = a.content;
  return (
    <div className="space-y-2">
      <img src={a.assetUrl!} alt="Generated thumbnail" className="w-full rounded-lg border border-border" />
      <div className="text-[11px] text-muted-foreground">{c.size}</div>
    </div>
  );
}

function fmtT(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
