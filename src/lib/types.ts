export type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  defaultLanguage: string;
  isActive: boolean;
  createdAt: string;
};

export type ProjectStatus =
  | "draft" | "generating" | "pending_review" | "approved" | "published" | "rejected";

export type Project = {
  id: number;
  userId: number;
  title: string;
  topic: string;
  niche: string;
  format: string;
  language: string;
  voice: string;
  narrationSpeed: number;
  subtitleStyle: string;
  tone: string;
  targetLength: string;
  keywords: string;
  musicBed: string;
  platforms: string;
  approvalPolicy: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type Script = {
  id: number;
  projectId: number;
  content: string;
  wordCount: number;
  estimatedDurationSec: number;
  version: number;
  updatedAt: string;
};

export type WorkflowRun = {
  id: number;
  projectId: number;
  stage: string;
  status: string;
  progress: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type QueueRun = WorkflowRun & { projectTitle: string };

export const STAGES = ["script", "voice", "storyboard", "render", "review", "publish"] as const;

export const NICHES = [
  { k: "tech", n: "Technology", s: "AI · Gadgets" },
  { k: "finance", n: "Finance", s: "Money · Crypto" },
  { k: "health", n: "Health", s: "Fitness · Diet" },
  { k: "edu", n: "Education", s: "How-to · Explain" },
  { k: "ent", n: "Entertainment", s: "Pop · Culture" },
  { k: "biz", n: "Business", s: "Startups · Growth" },
];

export const FORMATS = [
  { k: "16-9", n: "Long-form", s: "16:9 · YouTube" },
  { k: "9-16", n: "Short / Reel", s: "9:16 · Shorts" },
  { k: "1-1", n: "Square", s: "1:1 · Feed" },
];

export const VOICES = [
  { k: "en-us-female", n: "Aria", s: "Female · US English" },
  { k: "en-us-male", n: "Ethan", s: "Male · US English" },
  { k: "en-uk-female", n: "Ivy", s: "Female · UK English" },
  { k: "bn-female", n: "Tara", s: "Female · Bengali" },
  { k: "es-male", n: "Mateo", s: "Male · Spanish" },
];

export const STYLES = [
  { k: "minimal", n: "Minimal" },
  { k: "bold", n: "Bold" },
  { k: "cinematic", n: "Cinematic" },
  { k: "karaoke", n: "Karaoke" },
];

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  published:      { label: "Published",      cls: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30" },
  pending_review: { label: "Pending review", cls: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30" },
  approved:       { label: "Approved",       cls: "bg-[#2563eb]/15 text-[#2563eb] border-[#2563eb]/30" },
  generating:     { label: "Generating",     cls: "bg-[#7c3aed]/15 text-[#a78bfa] border-[#7c3aed]/30" },
  rejected:       { label: "Rejected",       cls: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30" },
  draft:          { label: "Draft",          cls: "bg-[#6b7493]/15 text-[#9aa3bd] border-[#6b7493]/30" },
};

export const fmtFormat = (f: string) =>
  ({ "16-9": "16:9", "9-16": "9:16", "1-1": "1:1" } as Record<string, string>)[f] || f;

export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const fmtTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const pct = (n: number, total: number) => (total ? Math.round((n * 100) / total) : 0);
