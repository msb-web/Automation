"use client";
import { useEffect, useState } from "react";
import { Video, CheckCircle, RefreshCw, Clock, Activity, AlertTriangle, HeartPulse } from "lucide-react";
import type { Project } from "@/lib/types";
import { fmtDate, fmtFormat, fmtTime } from "@/lib/types";
import { api } from "@/lib/api-client";
import { Card, CardHead, StatCard, StatusPill, Pill } from "../app/shared";
import { TrendChart, DonutChart, BarsChart, daySeries } from "../app/charts";

const NICHE_PALETTE = ["#7c3aed", "#2563eb", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a78bfa"];

export function AnalyticsView({ projects }: { projects: Project[] }) {
  const published = projects.filter((p) => p.status === "published");
  const generating = projects.filter((p) => p.status === "generating").length;
  const pending = projects.filter((p) => p.status === "pending_review").length;

  const nicheCnt: Record<string, number> = {};
  projects.forEach((p) => { nicheCnt[p.niche] = (nicheCnt[p.niche] || 0) + 1; });
  const nicheParts = Object.entries(nicheCnt).map(([n, v], i) => ({ name: n, value: v, color: NICHE_PALETTE[i % NICHE_PALETTE.length] }));

  let yt = 0, fb = 0;
  projects.forEach((p) => {
    const pl = (p.platforms || "").split(",");
    if (pl.includes("youtube")) yt++;
    if (pl.includes("facebook")) fb++;
  });
  const platformBars = [
    { label: "YouTube", value: yt, color: "#ef4444" },
    { label: "Facebook", value: fb, color: "#1877f2" },
  ];

  const fmtCnt: Record<string, number> = {};
  projects.forEach((p) => { fmtCnt[p.format] = (fmtCnt[p.format] || 0) + 1; });

  type Health = { status: string; db: string; mode: string; scheduler: string; time: string };
  type Monitor = {
    total: number; published: number; scheduled: number; failed: number;
    successRate: number | null;
    recentFailures: Array<{ projectId: number; platform: string; error: string | null; updatedAt: string }>;
    recentPublishes: Array<{ projectId: number; platform: string; url: string | null; publishedAt: string | null }>;
  };
  const [health, setHealth] = useState<Health | null>(null);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  useEffect(() => {
    api.get<Health>("/api/health").then(setHealth).catch(() => {});
    api.get<Monitor>("/api/publish/monitor").then(setMonitor).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Video className="h-5 w-5" />} tint="#7c3aed" label="Total videos" value={projects.length} delta="In library" />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} tint="#22c55e" label="Published" value={published.length} delta="Live on platforms" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} tint="#2563eb" label="In pipeline" value={generating} delta="Generating" />
        <StatCard icon={<Clock className="h-5 w-5" />} tint="#f59e0b" label="Pending review" value={pending} delta="Awaiting approval" highlight={pending > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHead title="Projects over time" sub="Created per day · last 30 days" />
          <TrendChart data={daySeries(projects, 30)} color="#2563eb" height={240} />
        </Card>
        <Card>
          <CardHead title="By niche" sub="Share of projects" />
          <DonutChart data={nicheParts} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="By platform" sub="Projects targeting each" />
          <BarsChart data={platformBars} />
        </Card>
        <Card>
          <CardHead title="Recently published" sub="Newest live videos" />
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Platforms</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {published.length ? (
                  published.slice(0, 6).map((v) => (
                    <tr key={v.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{v.title}</div>
                        <div className="text-xs text-muted-foreground">{v.niche}</div>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{v.platforms || "—"}</td>
                      <td className="py-2">{fmtDate(v.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Nothing published yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="By format" sub="Distribution across aspect ratios" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.keys(fmtCnt).length ? (
            Object.entries(fmtCnt).map(([f, c]) => (
              <div key={f} className="rounded-lg border border-border bg-[#1c2233] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded bg-[#7c3aed]" />
                  <span className="text-xs text-muted-foreground">{fmtFormat(f)}</span>
                </div>
                <div className="text-xl font-extrabold">{c}</div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-muted-foreground">No data.</div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="System health" sub="Live service status" />
          {health ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={health.status === "ok" ? "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30" : "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30"}>
                  <HeartPulse className="mr-1 inline h-3 w-3" /> {health.status.toUpperCase()}
                </Pill>
                <Pill className="bg-muted text-muted-foreground border-border">DB {health.db}</Pill>
                <Pill className="bg-muted text-muted-foreground border-border">Mode {health.mode}</Pill>
                <Pill className="bg-muted text-muted-foreground border-border">Scheduler {health.scheduler}</Pill>
              </div>
              <div className="text-xs text-muted-foreground">Checked {fmtTime(health.time)}</div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading health…</div>
          )}
        </Card>
        <Card>
          <CardHead
            title="Publishing monitor"
            sub="Success rate, scheduled & recent failures"
            action={monitor && monitor.successRate !== null ? (
              <span className="text-2xl font-extrabold text-[#22c55e]">{monitor.successRate}%</span>
            ) : undefined}
          />
          {monitor ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border bg-[#1c2233] p-2">
                  <div className="text-lg font-bold text-[#22c55e]">{monitor.published}</div>
                  <div className="text-[10px] text-muted-foreground">Published</div>
                </div>
                <div className="rounded-lg border border-border bg-[#1c2233] p-2">
                  <div className="text-lg font-bold text-[#a78bfa]">{monitor.scheduled}</div>
                  <div className="text-[10px] text-muted-foreground">Scheduled</div>
                </div>
                <div className="rounded-lg border border-border bg-[#1c2233] p-2">
                  <div className="text-lg font-bold text-[#ef4444]">{monitor.failed}</div>
                  <div className="text-[10px] text-muted-foreground">Failed</div>
                </div>
              </div>
              {monitor.recentFailures.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#fca5a5]"><AlertTriangle className="h-3.5 w-3.5" /> Recent failures</div>
                  {monitor.recentFailures.map((f, i) => (
                    <div key={i} className="truncate text-xs text-muted-foreground">
                      #{f.projectId} {f.platform}: <span className="text-[#fca5a5]">{f.error}</span> · {fmtTime(f.updatedAt)}
                    </div>
                  ))}
                </div>
              )}
              {monitor.recentPublishes.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#86efac]"><Activity className="h-3.5 w-3.5" /> Recent publishes</div>
                  {monitor.recentPublishes.map((p, i) => (
                    <div key={i} className="truncate text-xs text-muted-foreground">
                      #{p.projectId} {p.platform} · {fmtTime(p.publishedAt)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading monitor…</div>
          )}
        </Card>
      </div>
    </div>
  );
}
