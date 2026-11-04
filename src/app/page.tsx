"use client";
import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { Project, QueueRun, User } from "@/lib/types";
import { AuthScreen } from "@/components/app/AuthScreen";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { DashboardView } from "@/components/views/DashboardView";
import { CreateView } from "@/components/views/CreateView";
import { EditorView } from "@/components/views/EditorView";
import { QueueView } from "@/components/views/QueueView";
import { ApprovalsView } from "@/components/views/ApprovalsView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { SettingsView } from "@/components/views/SettingsView";
import { AIStudioView } from "@/components/views/AIStudioView";
import { ProduceView } from "@/components/views/ProduceView";

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [queue, setQueue] = useState<QueueRun[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [ps, qs] = await Promise.all([
      api.get<Project[]>("/api/projects"),
      api.get<QueueRun[]>("/api/workflow/queue").catch(() => [] as QueueRun[]),
    ]);
    setProjects(ps);
    setQueue(qs);
  }, []);

  // Boot: ensure demo data exists, then restore session if any.
  useEffect(() => {
    (async () => {
      try {
        await api.post("/api/seed").catch(() => {});
        const me = await api.get<User>("/api/auth/me");
        setUser(me);
        await loadData();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setUser(null);
        }
      } finally {
        setBooting(false);
      }
    })();
  }, [loadData]);

  function handleAuth(u: User) {
    setUser(u);
    setView("dashboard");
    loadData();
  }

  async function logout() {
    await api.post("/api/auth/logout").catch(() => {});
    setUser(null);
    setProjects([]);
    setQueue([]);
    setCurrentProjectId(null);
  }

  function nav(v: string) {
    setView(v);
    // EditorView syncs currentProjectId itself with fresh props — doing it here
    // would use a stale closure and override a project just set by CreateView.
  }

  const queueBadge = queue.length;
  const approvalBadge = projects.filter((p) => p.status === "pending_review").length;

  if (booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-grad">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          view={view}
          onNav={nav}
          queueBadge={queueBadge}
          approvalBadge={approvalBadge}
          onLogout={logout}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              user={user}
              view={view}
              onNav={nav}
              queueBadge={queueBadge}
              approvalBadge={approvalBadge}
              onLogout={logout}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar view={view} onMenu={() => setSidebarOpen(true)} onCreate={() => nav("create")} />
        <main className="flex-1 p-4 scrollbar-thin md:p-6">
          {view === "dashboard" && <DashboardView projects={projects} queue={queue} nav={nav} />}
          {view === "create" && (
            <CreateView nav={nav} setCurrentProjectId={setCurrentProjectId} refresh={loadData} />
          )}
          {view === "editor" && (
            <EditorView
              projects={projects}
              currentProjectId={currentProjectId}
              setCurrentProjectId={setCurrentProjectId}
              refresh={loadData}
              nav={nav}
            />
          )}
          {view === "queue" && <QueueView projects={projects} queue={queue} refresh={loadData} />}
          {view === "approvals" && <ApprovalsView projects={projects} refresh={loadData} />}
          {view === "analytics" && <AnalyticsView projects={projects} />}
          {view === "settings" && <SettingsView user={user} projects={projects} />}
          {view === "ai-studio" && (
            <AIStudioView
              projects={projects}
              currentProjectId={currentProjectId}
              setCurrentProjectId={setCurrentProjectId}
              refresh={loadData}
              nav={nav}
            />
          )}
          {view === "produce" && (
            <ProduceView
              projects={projects}
              currentProjectId={currentProjectId}
              setCurrentProjectId={setCurrentProjectId}
              refresh={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
