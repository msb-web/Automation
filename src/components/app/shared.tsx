"use client";
import { cn } from "@/lib/utils";
import { STATUS_META, STAGES, cap, type WorkflowRun } from "@/lib/types";

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return <Pill className={meta.cls}>{meta.label}</Pill>;
}

export function StatCard({
  icon,
  tint,
  label,
  value,
  delta,
  highlight,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: string | number;
  delta?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        highlight && "border-[#f59e0b]/50"
      )}
    >
      <div
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: `${tint}22`, color: tint }}
      >
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold leading-tight">{value}</div>
      {delta && <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>}
    </div>
  );
}

function nodeState(run?: WorkflowRun): "done" | "active" | "idle" {
  if (!run) return "idle";
  if (run.status === "done") return "done";
  if (run.status === "running") return "active";
  return "idle";
}

export function Pipeline({ runs, mini }: { runs: WorkflowRun[]; mini?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {STAGES.map((s, i) => {
        const run = runs.find((r) => r.stage === s);
        const st = nodeState(run);
        const color =
          st === "done" ? "#22c55e" : st === "active" ? "#7c3aed" : "#353e57";
        return (
          <div key={s} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg border font-bold",
                  mini ? "h-6 w-9 text-[9px]" : "h-10 w-10 text-[10px]"
                )}
                style={{
                  borderColor: color,
                  background: st === "active" ? `${color}22` : "transparent",
                  color: st === "idle" ? "#6b7493" : color,
                }}
              >
                {mini ? s.slice(0, 2).toUpperCase() : <NodeIcon stage={s} active={st !== "idle"} color={color} />}
              </div>
              {!mini && <span className="text-[10px] text-muted-foreground">{cap(s)}</span>}
            </div>
            {i < STAGES.length - 1 && (
              <span className={cn("text-muted-foreground", mini ? "text-xs" : "text-sm")}>›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NodeIcon({ stage, active, color }: { stage: string; active: boolean; color: string }) {
  // Lightweight stage glyph
  const map: Record<string, string> = {
    script: "✎", voice: "♪", storyboard: "▦", render: "▶", review: "✓", publish: "↗",
  };
  return <span style={{ color: active ? color : undefined }}>{map[stage] ?? "•"}</span>;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[#1c2233]", className)}>
      <div className="h-full rounded-full bg-grad transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>{children}</div>
  );
}

export function CardHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
