"use client";
import { useState } from "react";
import { Sparkles, Mic, Film } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { NICHES, FORMATS, VOICES, STYLES, type Project } from "@/lib/types";
import { Card, CardHead } from "../app/shared";

const TONES = ["Educational", "Entertaining", "Professional", "Casual", "Inspirational"];
const LENGTHS = ["Auto", "Under 60s — Short", "1–3 min", "5–10 min", "10+ min"];
const MUSIC = ["Auto-match", "Upbeat corporate", "Cinematic ambient", "Lo-fi chill", "None"];

const IDEA_POOL = [
  "5 AI tools that replace a marketing team",
  "The real reason your phone battery dies fast",
  "Why everyone is talking about agentic AI",
  "3 morning habits of top performers",
  "Compound interest explained in 90 seconds",
];

export function CreateView({
  nav,
  setCurrentProjectId,
  refresh,
}: {
  nav: (v: string) => void;
  setCurrentProjectId: (id: number) => void;
  refresh: () => Promise<void>;
}) {
  const [topic, setTopic] = useState("How transformers power modern AI assistants");
  const [niche, setNiche] = useState("tech");
  const [format, setFormat] = useState("16-9");
  const [voice, setVoice] = useState("en-us-female");
  const [lang, setLang] = useState("en-US");
  const [style, setStyle] = useState("minimal");
  const [speed, setSpeed] = useState(1.0);
  const [tone, setTone] = useState("Educational");
  const [len, setLen] = useState("Auto");
  const [keywords, setKeywords] = useState("#ai #n8n #automation");
  const [music, setMusic] = useState("Auto-match");
  const [yt, setYt] = useState(true);
  const [fb, setFb] = useState(true);
  const [policy, setPolicy] = useState<"manual" | "auto">("manual");
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!topic.trim()) {
      toast.error("Enter a video topic first.");
      return;
    }
    const nicheMap = NICHES.find((n) => n.k === niche);
    const platforms = [yt ? "youtube" : "", fb ? "facebook" : ""].filter(Boolean).join(",") || "youtube";
    setBusy(true);
    toast.loading("Creating project & queueing pipeline…", { id: "gen" });
    try {
      const proj = await api.post<Project>("/api/projects", {
        title: topic.slice(0, 80),
        topic,
        niche: nicheMap ? nicheMap.n : niche,
        format,
        language: lang,
        voice,
        narrationSpeed: speed,
        subtitleStyle: style,
        tone,
        targetLength: len,
        keywords,
        musicBed: music,
        platforms,
        approvalPolicy: policy,
      });
      setCurrentProjectId(proj.id);
      await api
        .post(`/api/projects/${proj.id}/generate`)
        .catch((e) => toast.warning(`Project created; generate failed: ${e.message}`));
      await refresh();
      toast.success(`"${proj.title}" queued. Pipeline is generating.`, { id: "gen" });
      nav("editor");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed", { id: "gen" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        {["Topic & Niche", "Format & Voice", "Script", "Review"].map((s, i) => (
          <span key={s} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${i === 0 ? "bg-grad-soft text-white" : "bg-muted text-muted-foreground"}`}>
            <b className="opacity-70">{i + 1}</b> {s}
          </span>
        ))}
      </div>

      <Card>
        <CardHead
          title="Step 1 — Topic & niche"
          sub="Tell the AI what the video is about"
          action={
            <button
              onClick={() => setTopic(IDEA_POOL[Math.floor(Math.random() * IDEA_POOL.length)])}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI suggest
            </button>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Video topic *</span>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="aiva-input" />
          </label>

          <div className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Niche / category *</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NICHES.map((n) => (
                <OptTile key={n.k} active={niche === n.k} onClick={() => setNiche(n.k)} title={n.n} sub={n.s} />
              ))}
            </div>
          </div>

          <Sel label="Tone" value={tone} onChange={setTone} options={TONES} />
          <Sel label="Target length" value={len} onChange={setLen} options={LENGTHS} />
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Keywords / hashtags</span>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="aiva-input" />
          </label>
        </div>
      </Card>

      <Card>
        <CardHead title="Step 2 — Format, language & voice" sub="Output dimensions, narration language & voice profile" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Video format *</span>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <OptTile key={f.k} active={format === f.k} onClick={() => setFormat(f.k)} title={f.n} sub={f.s} icon={<Film className="h-4 w-4" />} />
              ))}
            </div>
          </div>
          <Sel label="Content language *" value={lang} onChange={setLang} options={["en-US", "en-UK", "bn-BD", "es-ES", "hi-IN", "ar-SA"]} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Narration voice *</span>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="aiva-input">
              {VOICES.map((v) => <option key={v.k} value={v.k}>{v.n} — {v.s}</option>)}
            </select>
            <button onClick={() => toast.info("Preview voice sample playing… (demo)")} className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Mic className="h-3.5 w-3.5" /> Preview voice
            </button>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Narration speed — {speed.toFixed(1)}×</span>
            <input type="range" min={0.5} max={2} step={0.1} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-[#7c3aed]" />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Subtitle style</span>
            <div className="grid grid-cols-4 gap-1.5">
              {STYLES.map((s) => (
                <button key={s.k} onClick={() => setStyle(s.k)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium ${style === s.k ? "border-[#7c3aed] bg-[#7c3aed]/15 text-white" : "border-border text-muted-foreground"}`}>
                  {s.n}
                </button>
              ))}
            </div>
          </div>
          <Sel label="Music bed" value={music} onChange={setMusic} options={MUSIC} />
        </div>
      </Card>

      <Card>
        <CardHead title="Step 3 — Publishing targets" sub="Where should the video go after approval?" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle label="YouTube" checked={yt} onChange={setYt} color="#ef4444" />
          <Toggle label="Facebook" checked={fb} onChange={setFb} color="#1877f2" />
          <div className="rounded-lg border border-border bg-[#1c2233] p-3.5">
            <div className="mb-2 text-sm font-semibold">Approval policy</div>
            <div className="flex gap-2">
              {(["manual", "auto"] as const).map((p) => (
                <button key={p} onClick={() => setPolicy(p)} className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize ${policy === p ? "border-[#7c3aed] bg-[#7c3aed]/15 text-white" : "border-border text-muted-foreground"}`}>
                  {p === "manual" ? "Manual review" : "Auto-publish"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <button onClick={generate} disabled={busy} className="flex items-center gap-2 rounded-lg bg-grad px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 transition hover:-translate-y-px disabled:opacity-60">
          <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate video"}
        </button>
      </div>

      <style>{`
        .aiva-input{width:100%;padding:10px 12px;background:#0e1119;border:1px solid #2a3146;border-radius:10px;outline:none;color:#e7eaf3;font-size:14px}
        .aiva-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px #2563eb33}
      `}</style>
    </div>
  );
}

function OptTile({ active, onClick, title, sub, icon }: { active: boolean; onClick: () => void; title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-lg border p-2.5 text-left transition ${active ? "border-[#7c3aed] bg-[#7c3aed]/15" : "border-border bg-[#0e1119] hover:border-[#353e57]"}`}>
      {icon && <div className="mb-1 text-[#9aa3bd]">{icon}</div>}
      <div className="text-xs font-semibold">{title}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </button>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="aiva-input">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-[#1c2233] p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}>{label[0]}</span>
        <b className="text-sm">{label}</b>
        <button onClick={() => onChange(!checked)} className={`ml-auto h-5 w-9 rounded-full transition ${checked ? "bg-[#7c3aed]" : "bg-[#353e57]"}`}>
          <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}
