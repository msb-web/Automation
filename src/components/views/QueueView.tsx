"use client";
import { RefreshCw, Video, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Project, QueueRun, WorkflowRun } from "@/lib/types";
import { STAGES, fmtTime, cap } from "@/lib/types";
import { Card, CardHead, StatCard, Pill, ProgressBar, Pipeline } from "../app/shared";

export function QueueView({
  projects,
  queue,
  refresh,
}: {
  projects: Project[];
  queue: QueueRun[];
  refresh: () => Promise<void>;
}) {
  const generating = projects.filter((p) => p.status === "generating").length;

  async function advance(projectId: number) {
    try {
      const r = await api.post<WorkflowRun>(`/api/projects/${projectId}/workflow/advance`);
      toast.success(`Advanced to "${cap(r.stage)}" (${r.status}).`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Advance failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<RefreshCw className="h-5 w-5" />} tint="#7c3aed" label="Running now" value={queue.length} delta="Active stages" />
        <StatCard icon={<Video className="h-5 w-5" />} tint="#2563eb" label="Generating" value={generating} delta="Projects in pipeline" />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} tint="#22c55e" label="Published" value={projects.filter((p) => p.status === "published").length} delta="Live" />
        <StatCard icon={<Clock className="h-5 w-5" />} tint="#f59e0b" label="Pending review" value={projects.filter((p) => p.status === "pending_review").length} delta="Awaiting approval" />
      </div>

      <Card>
        <CardHead
          title="Live execution queue"
          sub="Workflow runs currently running"
          action={
            <button onClick={() => refresh().then(() => toast.success("Queue refreshed."))} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          }
        />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Project</th>
                <th className="pb-2 pr-3 font-medium">Stage &amp; progress</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Pipeline</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {queue.length ? (
                queue.map((q) => {
                  const idx = STAGES.indexOf(q.stage as (typeof STAGES)[number]);
                  const synth: WorkflowRun[] = STAGES.map((s, i) => ({
                    id: i, projectId: q.projectId, stage: s,
                    status: i < idx ? "done" : i === idx ? "running" : "pending",
                    progress: i < idx ? 100 : i === idx ? q.progress : 0,
                    startedAt: null, finishedAt: null, createdAt: "",
                  }));
                  return (
                    <tr key={q.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium">{q.projectTitle}</div>
                        <div className="text-xs text-muted-foreground">#{q.id} · started {fmtTime(q.startedAt)}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Pill className="bg-[#7c3aed]/15 text-[#a78bfa] border-[#7c3aed]/30 capitalize">{q.stage}</Pill>
                          <span className="text-xs text-muted-foreground">{q.progress}%</span>
                        </div>
                        <ProgressBar value={q.progress} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <Pill className={q.status === "running" ? "bg-[#7c3aed]/15 text-[#a78bfa] border-[#7c3aed]/30" : "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30"}>{cap(q.status)}</Pill>
                      </td>
                      <td className="py-2.5 pr-3"><Pipeline runs={synth} mini /></td>
                      <td className="py-2.5">
                        <button onClick={() => advance(q.projectId)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                          Advance <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nothing running right now. Generate a video to start the pipeline.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
