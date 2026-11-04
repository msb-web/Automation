"use client";
import {
  LayoutDashboard, Sparkles, Wand2, Clapperboard, FileText, ListTodo, ClipboardCheck,
  BarChart3, Settings as SettingsIcon, LogOut,
} from "lucide-react";
import type { User } from "@/lib/types";

const NAV = [
  { k: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { k: "create", label: "Create Video", icon: Sparkles },
  { k: "ai-studio", label: "AI Studio", icon: Wand2 },
  { k: "produce", label: "Produce", icon: Clapperboard },
  { k: "editor", label: "Script Editor", icon: FileText },
  { k: "queue", label: "Pipeline Queue", icon: ListTodo },
  { k: "approvals", label: "Approvals", icon: ClipboardCheck },
  { k: "analytics", label: "Analytics", icon: BarChart3 },
  { k: "settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar({
  user,
  view,
  onNav,
  queueBadge,
  approvalBadge,
  onLogout,
  onClose,
}: {
  user: User;
  view: string;
  onNav: (v: string) => void;
  queueBadge: number;
  approvalBadge: number;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full w-[248px] flex-col border-r border-border bg-gradient-to-b from-[#0e1119] to-[#0b0d14]">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-grad">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">AI Video Hub</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Automation</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        <div className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const badge =
            n.k === "queue" ? queueBadge : n.k === "approvals" ? approvalBadge : 0;
          const active = view === n.k;
          return (
            <button
              key={n.k}
              onClick={() => {
                onNav(n.k);
                onClose?.();
              }}
              className={`relative mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-grad-soft text-white" : "text-muted-foreground hover:bg-[#161a27] hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-grad" />
              )}
              <Icon className="h-[18px] w-[18px] opacity-80" />
              <span>{n.label}</span>
              {badge > 0 && (
                <span className="ml-auto rounded-full bg-[#7c3aed] px-2 py-0.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-[#161a27]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grad text-sm font-bold text-white">
            {(user.name || user.email).trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight">{user.name}</div>
            <div className="truncate text-[11px] capitalize text-muted-foreground">
              {user.role} · {user.defaultLanguage}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-[#ef4444]/15 hover:text-[#ef4444]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
