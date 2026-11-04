"use client";
import { useEffect, useState } from "react";
import { Sparkles, Save, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Project, Script, WorkflowRun } from "@/lib/types";
import { Card, CardHead, StatusPill, Pipeline } from "../app/shared";

const WORDS_PER_MINUTE = 150;

function localMetrics(text: string) {
  const wc = (text.replace(/\[[^\]]+\]/g, "").trim().match(/\S+/g) || []).length;
  return { wc, dur: Math.round((wc / WORDS_PER_MINUTE) * 60) };
}

export function EditorView({
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
  const [script, setScript] = useState<Script | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const projectId = currentProjectId ?? projects[0]?.id ?? null;
  const project = projects.find((p) => p.id === projectId) || null;

  // Sync currentProjectId with fresh props when entering the editor without one.
  useEffect(() => {
    if (!currentProjectId && projects.length) setCurrentProjectId(projects[0].id);
  }, [currentProjectId, projects, setCurrentProjectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const [sc, rs] = await Promise.all([
          api.get<Script>(`/api/projects/${projectId}/script`),
          api.get<WorkflowRun[]>(`/api/projects/${projectId}/workflow`).catch(() => []),
        ]);
        if (cancel) return;
        setScript(sc);
        setRuns(rs);
        setText(sc.content);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load script");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [projectId]);

  const m = localMetrics(text);
  const cur = project;
  const blocks = text.split(/\n(?=\[)/).filter(Boolean);

  async function save() {
    if (!projectId) return;
    try {
      const sc = await api.put<Script>(`/api/projects/${projectId}/script`, { content: text });
      setScript(sc);
      toast.success(`Saved · v${sc.version} · ${sc.wordCount} words · ~${Math.floor(sc.estimatedDurationSec / 60)}:${String(sc.estimatedDurationSec % 60).padStart(2, "0")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function lock() {
    if (!projectId) return;
    if (!text.trim()) {
      toast.error("Cannot lock an empty script.");
      return;
    }
    try {
      await api.put(`/api/projects/${projectId}/script`, { content: text });
      await api.post(`/api/projects/${projectId}/script/lock`);
      toast.success("Script locked. Voice synthesis started.");
      const rs = await api.get<WorkflowRun[]>(`/api/projects/${projectId}/workflow`).catch(() => []);
      setRuns(rs);
      await refresh();
      setTimeout(() => nav("queue"), 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lock failed");
    }
  }

  if (!projects.length) {
    return <Card><p className="py-8 text-center text-muted-foreground">No projects yet — create one first.</p></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Project</span>
            <select
              value={projectId ?? ""}
              onChange={(e) => setCurrentProjectId(Number(e.target.value))}
              className="aiva-input"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <BlockBtn label="+ Hook" onClick={() => insert("HOOK")} />
            <BlockBtn label="+ Body" onClick={() => insert("BODY")} />
            <BlockBtn label="+ CTA" onClick={() => insert("CTA")} />
            <button onClick={() => toast.info("AI expanded the selected paragraph with 2 supporting examples.")} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Sparkles className="h-3.5 w-3.5" /> AI expand
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <Tag>SCRIPT.md</Tag>
            <Tag>{loading ? "…" : `${m.wc} words`}</Tag>
            <Tag>~ {Math.floor(m.dur / 60)}:{String(m.dur % 60).padStart(2, "0")}</Tag>
            <span className="ml-auto text-muted-foreground">v{script?.version ?? 1}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="h-[420px] w-full resize-none rounded-lg border border-border bg-[#0e1119] p-3 font-mono text-sm text-foreground outline-none focus:border-[#2563eb]"
            placeholder="[HOOK]&#10;Write an attention-grabbing opener…&#10;&#10;[BODY]&#10;Your main content…&#10;&#10;[CTA]&#10;Tell viewers what to do next."
          />
        </Card>

        <Card className="flex flex-col">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <Tag>LIVE PREVIEW</Tag>
            <span className="ml-auto text-muted-foreground">Auto-updates as you type</span>
          </div>
          <div className="h-[420px] overflow-y-auto rounded-lg border border-border bg-[#0e1119] p-3 scrollbar-thin">
            {blocks.length ? (
              blocks.map((b, i) => {
                const match = b.match(/^\[([^\]]+)\]/);
                const tag = match ? match[1] : "INTRO";
                const body = b.replace(/^\[[^\]]+\]\n?/, "").trim();
                return (
                  <div key={i} className="mb-3">
                    <div className="mb-1 inline-block rounded bg-[#7c3aed]/20 px-2 py-0.5 text-[10px] font-bold text-[#a78bfa]">{tag}</div>
                    <p className="text-sm leading-relaxed text-foreground/90">{body || <span className="text-muted-foreground">…</span>}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Start typing to see the preview…</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead
          title="Pipeline status"
          sub={cur ? `${cur.title} · ${cur.status}` : "No project selected"}
          action={cur ? <StatusPill status={cur.status} /> : null}
        />
        <div className="mb-3"><Pipeline runs={runs} /></div>
        <div className="flex justify-end gap-2">
          <button onClick={save} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <Save className="h-4 w-4" /> Save version
          </button>
          <button onClick={lock} className="flex items-center gap-2 rounded-lg bg-grad px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20">
            <Lock className="h-4 w-4" /> Lock script &amp; generate
          </button>
        </div>
      </Card>

      <style>{`
        .aiva-input{width:100%;padding:10px 12px;background:#0e1119;border:1px solid #2a3146;border-radius:10px;outline:none;color:#e7eaf3;font-size:14px}
        .aiva-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px #2563eb33}
      `}</style>
    </div>
  );

  function insert(tag: string) {
    setText((t) => `${t}\n[${tag}]\n`);
  }
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-border bg-[#1c2233] px-2 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}

function BlockBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
      {label}
    </button>
  );
}
