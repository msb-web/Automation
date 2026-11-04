"use client";
import { Video, CheckCircle, RefreshCw, Sparkles, Film, ArrowRight } from "lucide-react";
import type { Project, QueueRun } from "@/lib/types";
import { fmtDate, fmtFormat, pct } from "@/lib/types";
import { Card, CardHead, StatCard, StatusPill, Pill, ProgressBar } from "../app/shared";
import { TrendChart, DonutChart, daySeries } from "../app/charts";

const STATUS_COLORS: Record<string, string> = {
  published: "#22c55e", generating: "#7c3aed", pending_review: "#f59e0b",
  approved: "#2563eb", rejected: "#ef4444", draft: "#6b7493",
};

export function DashboardView({
  projects,
  queue,
  nav,
}: {
  projects: Project[];
  queue: QueueRun[];
  nav: (v: string) => void;
}) {
  const published = projects.filter((p) => p.status === "published").length;
  const pending = projects.filter((p) => p.status === "pending_review").length;
  const generating = projects.filter((p) => p.status === "generating").length;
  const approved = projects.filter((p) => p.status === "approved").length;

  const statusParts = Object.entries(STATUS_COLORS)
    .map(([k, color]) => ({ name: k, value: projects.filter((p) => p.status === k).length, color }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Video className="h-5 w-5" />} tint="#7c3aed" label="Videos in library" value={projects.length} delta={`${approved} approved`} />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} tint="#22c55e" label="Pending approvals" value={pending} delta={pending ? "Awaiting your review" : "All clear"} highlight={pending > 0} />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} tint="#2563eb" label="In pipeline" value={queue.length} delta={`${generating} generating`} />
        <StatCard icon={<Sparkles className="h-5 w-5" />} tint="#06b6d4" label="Published" value={published} delta={published ? "Live on platforms" : "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHead
            title="Recent videos"
            sub="Latest from the pipeline"
            action={
              <button onClick={() => nav("approvals")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Video</th>
                  <th className="pb-2 pr-3 font-medium">Niche</th>
                  <th className="pb-2 pr-3 font-medium">Format</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.length ? (
                  projects.slice(0, 5).map((v) => (
                    <tr key={v.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1c2233] text-[#9aa3bd]">
                            <Film className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{v.title}</div>
                            <div className="truncate text-xs text-muted-foreground">{v.topic}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3"><Pill className="bg-muted text-muted-foreground border-border">{v.niche}</Pill></td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{fmtFormat(v.format)}</td>
                      <td className="py-2.5 pr-3"><StatusPill status={v.status} /></td>
                      <td className="py-2.5 font-medium">{fmtDate(v.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No projects yet — create your first video.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHead title="Status split" sub="All projects by status" />
          <DonutChart data={statusParts} />
          <div className="mt-3 space-y-2.5">
            {[
              { l: "Published", v: published, c: "#22c55e" },
              { l: "In pipeline", v: generating, c: "#7c3aed" },
              { l: "Pending review", v: pending, c: "#f59e0b" },
              { l: "Approved", v: approved, c: "#2563eb" },
            ].map((r) => (
              <div key={r.l}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.l}</span>
                  <b>{r.v}</b>
                </div>
                <ProgressBar value={pct(r.v, projects.length)} className="bg-[#1c2233]" />
                <div className="sr-only">{r.c}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Projects over time" sub="Created per day · last 14 days" />
          <TrendChart data={daySeries(projects, 14)} color="#2563eb" />
        </Card>
        <Card>
          <CardHead
            title="Live pipeline queue"
            sub={`${queue.length} video${queue.length === 1 ? "" : "s"} running`}
            action={
              <button onClick={() => nav("queue")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Open <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="space-y-3.5">
            {queue.length ? (
              queue.slice(0, 4).map((q) => (
                <div key={q.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="truncate text-sm font-semibold">{q.projectTitle}</span>
                    <span className="text-xs capitalize text-muted-foreground">{q.stage}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ProgressBar value={q.progress} className="flex-1" />
                    <Pill className="bg-[#7c3aed]/15 text-[#a78bfa] border-[#7c3aed]/30 capitalize">{q.stage} · {q.progress}%</Pill>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Queue is empty.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
