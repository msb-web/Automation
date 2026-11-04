"use client";
import { Youtube, Facebook, RefreshCw, Plug } from "lucide-react";
import type { Project, User } from "@/lib/types";
import { Card, CardHead, ProgressBar } from "../app/shared";

export function SettingsView({
  user,
  projects,
}: {
  user: User;
  projects: Project[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHead title="Account" sub="Signed-in user · from /api/auth/me" />
          <div className="divide-y divide-border">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
            <Row label="Default language" value={user.defaultLanguage} />
            <Row label="User ID" value={`#${user.id}`} />
          </div>
        </Card>

        <Card>
          <CardHead title="Default content settings" sub="Applied to every new video unless overridden" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default language"><select disabled className="aiva-input"><option>{user.defaultLanguage}</option></select></Field>
            <Field label="Default narration speed"><input type="number" step="0.1" defaultValue={1} className="aiva-input" /></Field>
          </div>
        </Card>

        <Card>
          <CardHead title="Platform connections" sub="OAuth accounts for publishing" />
          <div className="divide-y divide-border">
            <PlatRow icon={<Youtube className="h-4 w-4 text-[#ef4444]" />} name="YouTube" detail="@AIVideoHub · 24.1K subs" connected />
            <PlatRow icon={<Facebook className="h-4 w-4 text-[#1877f2]" />} name="Facebook" detail="AI Video Hub page · 8.7K followers" connected />
            <PlatRow icon={<Plug className="h-4 w-4 text-muted-foreground" />} name="Instagram" detail="Not connected" />
            <PlatRow icon={<Plug className="h-4 w-4 text-muted-foreground" />} name="TikTok" detail="Not connected" />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHead title="Backend connection" sub="API base URL" />
          <Field label="API base">
            <input readOnly value="Built-in (same origin · /api)" className="aiva-input font-mono text-xs" />
          </Field>
          <p className="mt-2 text-xs text-muted-foreground">
            This live app is a full-stack Next.js port: the API routes live alongside the UI.
            The original FastAPI reference backend is preserved under <code className="text-foreground">download/backend/</code>.
          </p>
        </Card>

        <Card>
          <CardHead title="n8n workflow" sub="Automation pipeline endpoint" />
          <Field label="Webhook URL">
            <input readOnly value="https://n8n.company.io/webhook/video-pipeline" className="aiva-input font-mono text-xs" />
          </Field>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </Card>

        <Card>
          <CardHead title="Plan & usage" sub="Pro plan" />
          <div className="mb-1.5 text-xs text-muted-foreground">Projects created</div>
          <ProgressBar value={Math.min(100, projects.length * 5)} />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{projects.length} total</span>
            <span>Pro plan</span>
          </div>
        </Card>
      </div>

      <style>{`
        .aiva-input{width:100%;padding:10px 12px;background:#0e1119;border:1px solid #2a3146;border-radius:10px;outline:none;color:#e7eaf3;font-size:14px}
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-medium">{value}</span>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function PlatRow({ icon, name, detail, connected }: { icon: React.ReactNode; name: string; detail: string; connected?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <div className="flex h-7 w-7 items-center justify-center">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{detail}</div>
      </div>
      <button className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${connected ? "bg-[#ef4444]/15 text-[#ef4444]" : "bg-grad text-white"}`}>
        {connected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}
