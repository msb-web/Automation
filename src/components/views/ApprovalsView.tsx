"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle, RefreshCw, Play, Check, X, Upload, CalendarClock,
  Youtube, Facebook, ExternalLink, Loader2, Bell, Eye, Monitor, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { fmtFormat, fmtDate, fmtTime } from "@/lib/types";
import { Card, CardHead, StatCard, StatusPill, Pill } from "../app/shared";

const PLATFORMS = [
  { k: "youtube", n: "YouTube", Icon: Youtube, color: "#ef4444" },
  { k: "facebook", n: "Facebook", Icon: Facebook, color: "#2563eb" },
];

type PubRecord = {
  id: number; platform: string; externalId: string | null; url: string | null;
  status: string; scheduledAt: string | null; publishedAt: string | null; error: string | null;
};

type VideoArtifact = {
  longUrl?: string;
  shortUrl?: string;
  durationSec?: number;
  scenes?: number;
};

const recStatusCls: Record<string, string> = {
  published: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30",
  scheduled: "bg-[#7c3aed]/15 text-[#a78bfa] border-[#7c3aed]/30",
  pending: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30",
  failed: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30",
};

export function ApprovalsView({
  projects,
  refresh,
}: {
  projects: Project[];
  refresh: () => Promise<void>;
}) {
  const review = projects.filter((p) => p.status === "pending_review");
  const pubReady = projects.filter((p) => p.status === "approved" || p.status === "published");
  const [config, setConfig] = useState<{ youtube: boolean; facebook: boolean; mode: string } | null>(null);
  const [records, setRecords] = useState<Record<number, PubRecord[]>>({});
  const [videos, setVideos] = useState<Record<number, VideoArtifact | null>>({});
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [sel, setSel] = useState<Record<number, string[]>>({});
  const [sched, setSched] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const loadRecords = useCallback(async (id: number) => {
    try {
      const r = await api.get<{ records: PubRecord[] }>(`/api/projects/${id}/publish`);
      setRecords((prev) => ({ ...prev, [id]: r.records }));
    } catch { /* ignore */ }
  }, []);

  const loadVideo = useCallback(async (id: number) => {
    try {
      const arts = await api.get<{ kind: string; content: VideoArtifact }[]>(`/api/projects/${id}/artifacts`);
      const v = arts.find((a) => a.kind === "video");
      setVideos((prev) => ({ ...prev, [id]: (v?.content as VideoArtifact) ?? null }));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    api.get<{ youtube: boolean; facebook: boolean; mode: string }>(`/api/publish/config`).then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    projects
      .filter((p) => p.status === "approved" || p.status === "published")
      .forEach((p) => loadRecords(p.id));
    projects
      .filter((p) => p.status === "pending_review" || p.status === "approved" || p.status === "published")
      .forEach((p) => loadVideo(p.id));
  }, [projects, loadRecords, loadVideo]);

  function togglePlat(id: number, k: string) {
    setSel((prev) => {
      const cur = prev[id] || [];
      return { ...prev, [id]: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] };
    });
  }
  function selected(id: number, platforms: string): string[] {
    if (sel[id]) return sel[id];
    return platforms.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function approve(id: number) {
    try {
      const m = await api.post<{ message: string }>(`/api/projects/${id}/approve`);
      toast.success(m.message || "Approved");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    }
  }
  async function reject(id: number) {
    try {
      await api.patch(`/api/projects/${id}`, { status: "rejected" });
      toast.warning("Sent back for re-generation.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed");
    }
  }
  async function publish(id: number, scheduleAt?: string) {
    const proj = projects.find((p) => p.id === id);
    const platforms = selected(id, proj?.platforms || "youtube,facebook");
    if (!platforms.length) { toast.error("Select at least one platform"); return; }
    setBusy(id);
    try {
      const m = await api.post<{ message: string }>(`/api/projects/${id}/publish`, { platforms, scheduleAt });
      toast.success(m.message || (scheduleAt ? "Scheduled" : "Published"));
      setSched((p) => ({ ...p, [id]: "" }));
      await refresh();
      await loadRecords(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    }
    setBusy(null);
  }

  const previewProject = previewId !== null ? projects.find((p) => p.id === previewId) ?? null : null;
  const previewVideo = previewProject ? videos[previewProject.id] ?? null : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Clock className="h-5 w-5" />} tint="#f59e0b" label="Awaiting review" value={review.length} delta="Pending review" highlight={review.length > 0} />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} tint="#22c55e" label="Approved" value={projects.filter((p) => p.status === "approved").length} delta="Ready to publish" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} tint="#7c3aed" label="Published" value={projects.filter((p) => p.status === "published").length} delta="Live" />
      </div>

      <Card>
        <CardHead title="Review queue" sub="Preview, then approve or reject each render before it goes live · manual approval checkpoint" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {review.length ? (
          review.map((v) => {
            const vid = videos[v.id] ?? null;
            return (
              <div key={v.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#1c2233] to-[#0e1119]">
                  {vid && (vid.longUrl || vid.shortUrl) ? (
                    <button
                      onClick={() => setPreviewId(v.id)}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 transition hover:scale-105 hover:bg-white/20"
                      aria-label="Preview video"
                      title="Preview video"
                    >
                      <Play className="h-5 w-5 text-white" />
                    </button>
                  ) : (
                    <Play className="h-8 w-8 text-white/40" />
                  )}
                  <Pill className="absolute left-2.5 top-2.5 bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30">Pending</Pill>
                  <Pill className="absolute right-2.5 top-2.5 bg-muted text-muted-foreground border-border">{fmtFormat(v.format)}</Pill>
                </div>
                <div className="p-3.5">
                  <div className="line-clamp-2 text-sm font-semibold">{v.title}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{v.niche}</span>·<span>{v.voice}</span>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-border p-3">
                  <button onClick={() => approve(v.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#22c55e]/15 py-2 text-xs font-semibold text-[#22c55e] transition hover:bg-[#22c55e]/25">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => reject(v.id)} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#ef4444]/15 px-3 py-2 text-xs font-semibold text-[#ef4444] transition hover:bg-[#ef4444]/25">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Nothing awaiting review.</div>
        )}
      </div>

      <Card>
        <CardHead
          title="Publishing console"
          sub="Preview approved videos, then publish to YouTube & Facebook · schedule or publish now"
          action={
            config ? (
              <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${config.mode === "live" ? "border-[#22c55e]/30 bg-[#22c55e]/15 text-[#22c55e]" : "border-border bg-muted text-muted-foreground"}`}>
                {config.mode === "live" ? "Live credentials" : "Mock mode"} · YT {config.youtube ? "✓" : "—"} · FB {config.facebook ? "✓" : "—"}
              </span>
            ) : undefined
          }
        />
        {config && config.mode === "mock" && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-2 text-xs text-[#fbbf24]">
            <Bell className="h-3.5 w-3.5" />
            No platform credentials set (YOUTUBE_*, FACEBOOK_*). Publishes run in mock mode — real uploads activate once env vars are configured.
          </div>
        )}
        <div className="space-y-3">
          {pubReady.length ? (
            pubReady.map((v) => {
              const chosen = selected(v.id, v.platforms);
              const recs = records[v.id] || [];
              const vid = videos[v.id] ?? null;
              const canPreview = !!(vid && (vid.longUrl || vid.shortUrl));
              return (
                <div key={v.id} className="rounded-xl border border-border bg-[#0e1119] p-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{v.title}</div>
                      <div className="text-xs text-muted-foreground">{v.niche} · {fmtFormat(v.format)}</div>
                    </div>
                    <StatusPill status={v.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      {PLATFORMS.map(({ k, n, Icon, color }) => {
                        const on = chosen.includes(k);
                        return (
                          <button
                            key={k}
                            onClick={() => togglePlat(v.id, k)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${on ? "border-transparent text-white" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}
                            style={on ? { backgroundColor: color } : undefined}
                          >
                            <Icon className="h-3.5 w-3.5" /> {n}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="datetime-local"
                      value={sched[v.id] || ""}
                      onChange={(e) => setSched((p) => ({ ...p, [v.id]: e.target.value }))}
                      className="rounded-lg border border-border bg-[#0e1119] px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#2563eb]"
                    />
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => setPreviewId(v.id)}
                        disabled={!canPreview}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
                        title={canPreview ? "Preview video before publishing" : "No video rendered for this project"}
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      <button
                        onClick={() => publish(v.id)}
                        disabled={busy === v.id}
                        className="flex items-center gap-1.5 rounded-lg bg-grad px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {busy === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Publish now
                      </button>
                      <button
                        onClick={() => publish(v.id, sched[v.id] ? new Date(sched[v.id]!).toISOString() : undefined)}
                        disabled={busy === v.id || !sched[v.id]}
                        className="flex items-center gap-1.5 rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/15 px-3 py-1.5 text-xs font-semibold text-[#a78bfa] disabled:opacity-50"
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> Schedule
                      </button>
                    </div>
                  </div>
                  {recs.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2.5">
                      {recs.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="w-20 capitalize text-muted-foreground">{r.platform}</span>
                          <Pill className={recStatusCls[r.status] || "bg-muted text-muted-foreground border-border"}>{r.status}</Pill>
                          {r.publishedAt && <span className="text-muted-foreground">published {fmtDate(r.publishedAt)} {fmtTime(r.publishedAt)}</span>}
                          {r.scheduledAt && !r.publishedAt && <span className="text-muted-foreground">scheduled {fmtDate(r.scheduledAt)} {fmtTime(r.scheduledAt)}</span>}
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563eb] hover:underline">
                              <ExternalLink className="h-3 w-3" /> view
                            </a>
                          )}
                          {r.error && <span className="text-[#fca5a5]">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No approved videos to publish.</div>
          )}
        </div>
      </Card>

      {previewProject && previewVideo && (
        <VideoPreviewModal
          project={previewProject}
          video={previewVideo}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}

function VideoPreviewModal({
  project,
  video,
  onClose,
}: {
  project: Project;
  video: VideoArtifact;
  onClose: () => void;
}) {
  const hasLong = !!video.longUrl;
  const hasShort = !!video.shortUrl;
  const [which, setWhich] = useState<"long" | "short">(
    project.format === "9-16" && hasShort ? "short" : hasLong ? "long" : "short"
  );
  const url = (which === "long" ? video.longUrl : video.shortUrl) || video.longUrl || video.shortUrl || "";
  const dur = video.durationSec;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview video: ${project.title}`}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <Play className="h-4 w-4 shrink-0 text-[#a78bfa]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{project.title}</div>
            <div className="text-xs text-muted-foreground">
              {fmtFormat(project.format)}{dur ? ` · ${dur}s` : ""}{video.scenes ? ` · ${video.scenes} scenes` : ""}
            </div>
          </div>
          {hasLong && hasShort && (
            <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs">
              <button
                onClick={() => setWhich("long")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${which === "long" ? "bg-[#2563eb] text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Monitor className="h-3 w-3" /> Long
              </button>
              <button
                onClick={() => setWhich("short")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${which === "short" ? "bg-[#2563eb] text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Smartphone className="h-3 w-3" /> Short
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {url ? (
          which === "short" ? (
            <video
              key={url}
              controls
              autoPlay
              src={url}
              className="mx-auto block max-h-[70vh] rounded-lg border border-border"
              style={{ aspectRatio: "9 / 16", width: "auto" }}
            />
          ) : (
            <video
              key={url}
              controls
              autoPlay
              src={url}
              className="w-full rounded-lg border border-border"
            />
          )
        ) : (
          <div className="rounded-lg border border-border bg-muted p-8 text-center text-sm text-muted-foreground">
            No video file available for this project.
          </div>
        )}
      </div>
    </div>
  );
}
