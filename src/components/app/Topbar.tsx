"use client";
import { Menu, Plus } from "lucide-react";

const PAGE_META: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Production overview · live from the pipeline" },
  create: { title: "Create Video", sub: "Configure a new AI-generated video for the pipeline" },
  "ai-studio": { title: "AI Studio", sub: "AI content generation — Ollama LLM, Piper TTS, thumbnails" },
  produce: { title: "Video Production", sub: "FFmpeg pipeline — render long & short MP4 from AI assets" },
  editor: { title: "Script Editor", sub: "Write, structure & preview narration scripts" },
  queue: { title: "Pipeline Queue", sub: "Live workflow execution status" },
  approvals: { title: "Approvals & Publishing", sub: "Review generated videos before they go live" },
  analytics: { title: "Analytics", sub: "Performance across YouTube & Facebook" },
  settings: { title: "Settings", sub: "Languages, voices, integrations & AI providers" },
};

export function Topbar({
  view,
  onMenu,
  onCreate,
}: {
  view: string;
  onMenu: () => void;
  onCreate: () => void;
}) {
  const meta = PAGE_META[view] || PAGE_META.dashboard;
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-[#0b0d14]/80 px-4 backdrop-blur md:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg border border-border p-2 text-muted-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold">{meta.title}</h2>
        <p className="truncate text-xs text-muted-foreground">{meta.sub}</p>
      </div>
      <button
        onClick={onCreate}
        className="ml-auto flex items-center gap-2 rounded-lg bg-grad px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 transition hover:-translate-y-px"
      >
        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Video</span>
      </button>
    </header>
  );
}
