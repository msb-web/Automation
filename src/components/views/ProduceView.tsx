"use client";
import { useEffect, useState, useRef } from "react";
import {
  Clapperboard, Film, Play, Loader2, Download, CheckCircle2, XCircle, Smartphone, Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { fmtFormat } from "@/lib/types";
import { Card, StatusPill } from "../app/shared";

type Stage = "prereq" | "images" | "music" | "clips" | "concat" | "audio" | "mux" | "short" | "done" | "failed";
type Job = {
  id: string; projectId: number; stage: Stage; progress: number;
  status: "running" | "done" | "failed"; log: string[]; error?: string;
  longUrl?: string; shortUrl?: string; durationSec?: number; scenes?: number;
} | { status: "idle"; projectId: number };

const STAGES: [Stage, string][] = [
  ["prereq", "Prerequisites"], ["images", "Scene images"], ["music", "Music bed"],
  ["clips", "Scene clips (Ken Burns)"], ["concat", "Concatenate"], ["audio", "Audio mix"],
  ["mux", "Subtitles + mux"], ["short", "Short version"], ["done", "Render complete"],
];
const stageIndex = (s: Stage) => STAGES.findIndex(([k]) => k === s);

export function ProduceView({
  projects, currentProjectId, setCurrentProjectId, refresh,
}: {
  projects: Project[];
  currentProjectId: number | null;
  setCurrentProjectId: (id: number) => void;
  refresh: () => Promise<void>;
}) {
  const projectId = currentProjectId ?? projects[0]?.id ?? null;
  const project = projects.find((p) => p.id === projectId) || null;
  const [job, setJob] = useState<Job | null>(null);
  const [existing, setExisting] = useState<{ longUrl: string; shortUrl: string; durationSec?: number; scenes?: number } | null>(null);
  const [producing, setProducing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing rendered video + latest job for the selected project.
  useEffect(() => {
    if (!projectId) return;
    let cancel = false;
    (async () => {
      try {
        const arts = await api.get<any[]>(`/api/projects/${projectId}/artifacts`);
        if (cancel) return;
        const v = arts.find((a) => a.kind === "video");
        setExisting(v?.content ?? null);
        setJob(null);
      } catch { /* ignore */ }
      try {
        const j = await api.get<Job>(`/api/projects/${projectId}/produce/status`);
        if (cancel) return;
        if ((j as Job).status && (j as Job).status !== "idle") setJob(j as Job);
      } catch { /* ignore */ }
    })();
    return () => { cancel = true; };
  }, [projectId]);

  // Poll while running.
  useEffect(() => {
    if (!job || job.status !== "running" || !projectId) return;
    pollRef.current = setTimeout(async () => {
      try {
        const j = await api.get<Job>(`/api/projects/${projectId}/produce/status?jobId=${job.id}`);
        setJob(j as Job);
        if ((j as Job).status === "done") { setProducing(false); await refresh(); }
      } catch { /* keep polling */ }
    }, 1500);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [job, projectId, refresh]);

  async function produce() {
    if (!projectId) return;
    setProducing(true);
    setJob(null);
    try {
      const r = await api.post<{ jobId: string }>(`/api/projects/${projectId}/produce`);
      const j = await api.get<Job>(`/api/projects/${projectId}/produce/status?jobId=${r.jobId}`);
      setJob(j as Job);
      toast.success("Video production started");
    } catch (e) {
      setProducing(false);
      toast.error(e instanceof Error ? e.message : "Failed to start production");
    }
  }

  if (!projects.length) {
    return <Card><p className="py-8 text-center text-muted-foreground">Create a project first.</p></Card>;
  }

  const running = job?.status === "running";
  const done = job?.status === "done";
  const failed = job?.status === "failed";
  const longUrl = (done && job && "longUrl" in job ? job.longUrl : null) || existing?.longUrl;
  const shortUrl = (done && job && "shortUrl" in job ? job.shortUrl : null) || existing?.shortUrl;
  const logTail = job && "log" in job ? job.log.slice(-5) : [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Clapperboard className="h-5 w-5 text-[#a78bfa]" />
          <div>
            <div className="text-sm font-bold">Automated Video Production</div>
            <div className="text-xs text-muted-foreground">FFmpeg pipeline — scenes, voiceover, subtitles, music, transitions · long + short MP4</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={projectId ?? ""}
              onChange={(e) => setCurrentProjectId(Number(e.target.value))}
              className="rounded-lg border border-border bg-[#0e1119] px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            {project && <StatusPill status={project.status} />}
            <button
              onClick={produce}
              disabled={producing}
              className="flex items-center gap-2 rounded-lg bg-grad px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 disabled:opacity-60"
            >
              {producing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {producing ? "Producing…" : "Produce Video"}
            </button>
          </div>
        </div>
        {project && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {project.title} · {fmtFormat(project.format)} · tone {project.tone} · voice {project.voice}.
            Auto-fills any missing script, image prompts, voiceover or subtitles before rendering.
          </p>
        )}
      </Card>

      {/* Pipeline progress */}
      {(running || done || failed) && job && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            {done && <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />}
            {failed && <XCircle className="h-5 w-5 text-[#ef4444]" />}
            {running && <Loader2 className="h-5 w-5 animate-spin text-[#a78bfa]" />}
            <span className="text-sm font-bold">
              {failed ? "Production failed" : done ? "Video ready" : "Producing…"}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {"progress" in job ? `${job.progress}%` : ""}
            </span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${failed ? "bg-[#ef4444]" : "bg-grad"}`}
              style={{ width: `${"progress" in job ? job.progress : 0}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(([k, label]) => {
              const idx = stageIndex(k);
              const cur = stageIndex("stage" in job ? job.stage : "prereq");
              const state = failed ? "fail" : idx < cur ? "done" : idx === cur ? (done ? "done" : "cur") : "wait";
              return (
                <span
                  key={k}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                    state === "done" ? "bg-[#22c55e]/20 text-[#22c55e]" :
                    state === "cur" ? "bg-[#7c3aed]/30 text-[#a78bfa]" :
                    state === "fail" ? "bg-[#ef4444]/20 text-[#ef4444]" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {state === "done" ? "✓ " : state === "cur" ? "● " : ""}{label}
                </span>
              );
            })}
          </div>
          {failed && job && "error" in job && job.error && (
            <p className="mt-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-2 text-xs text-[#fca5a5]">{job.error}</p>
          )}
          {logTail.length > 0 && (
            <div className="mt-3 max-h-28 overflow-y-auto scrollbar-thin rounded-lg bg-[#0e1119] p-2 font-mono text-[11px] text-muted-foreground">
              {logTail.map((l, i) => <div key={i}>› {l}</div>)}
            </div>
          )}
        </Card>
      )}

      {/* Rendered videos */}
      {longUrl && shortUrl && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#60a5fa]" />
              <div>
                <h3 className="text-sm font-semibold">Long version</h3>
                <p className="text-xs text-muted-foreground">{fmtFormat(project?.format || "16-9")}{(existing?.durationSec || (job && "durationSec" in job ? job.durationSec : 0)) ? ` · ${Math.round((existing?.durationSec || (job && "durationSec" in job ? job.durationSec : 0))!)}s` : ""}</p>
              </div>
            </div>
            <video controls src={longUrl} className="mt-2 w-full rounded-lg border border-border" />
            <a href={longUrl} download className="mt-2 inline-flex items-center gap-1 text-xs text-[#2563eb] hover:underline">
              <Download className="h-3 w-3" /> Download MP4
            </a>
          </Card>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#22c55e]" />
              <div>
                <h3 className="text-sm font-semibold">Short version</h3>
                <p className="text-xs text-muted-foreground">9-16 · ≤60s{(existing?.durationSec || (job && "durationSec" in job ? job.durationSec : 0)) ? ` · ${Math.min(60, Math.round((existing?.durationSec || (job && "durationSec" in job ? job.durationSec : 0))!))}s` : ""}</p>
              </div>
            </div>
            <video controls src={shortUrl} className="mt-2 mx-auto block max-h-80 rounded-lg border border-border" style={{ aspectRatio: "9/16", width: "auto" }} />
            <a href={shortUrl} download className="mt-2 inline-flex items-center gap-1 text-xs text-[#22c55e] hover:underline">
              <Download className="h-3 w-3" /> Download MP4
            </a>
          </Card>
        </div>
      )}

      {!longUrl && !producing && (
        <Card className="flex items-center gap-3">
          <Film className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No video rendered yet for this project. Click <b>Produce Video</b> to run the FFmpeg pipeline.</p>
        </Card>
      )}
    </div>
  );
}
