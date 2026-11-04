"use client";
import { useState } from "react";
import { Sparkles, Youtube, Facebook } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";
import { toast } from "sonner";

export function AuthScreen({ onAuth }: { onAuth: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);

  // login fields
  const [email, setEmail] = useState("admin@aivideo.io");
  const [password, setPassword] = useState("demo1234");
  // register fields
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rLang, setRLang] = useState("en-US");

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post<{ user: User }>("/api/auth/login", { email, password });
      onAuth(res.user);
      toast.success(`Welcome back, ${(res.user.name || res.user.email).split(" ")[0]}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    if (rPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ user: User }>("/api/auth/register", {
        email: rEmail,
        password: rPass,
        name: rName,
        defaultLanguage: rLang,
      });
      onAuth(res.user);
      toast.success("Account created. Welcome aboard!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none absolute -left-20 -top-24 h-[420px] w-[420px] rounded-full bg-[#7c3aed] opacity-50 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-[380px] w-[380px] rounded-full bg-[#06b6d4] opacity-50 blur-[80px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-gradient-to-b from-[#161a27] to-[#121622] p-8 shadow-2xl">
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-grad shadow-lg shadow-[#7c3aed]/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Video Automation</h1>
            <span className="text-xs text-muted-foreground">Pipeline · Script · Publish</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 rounded-xl border border-border bg-[#0e1119] p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === m ? "bg-grad text-white shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <form onSubmit={submitLogin} className="mt-5 space-y-3">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </Field>
            <button type="submit" disabled={busy} className="auth-btn">
              {busy ? "Signing in…" : "Sign in to dashboard →"}
            </button>
            <p className="rounded-lg border border-dashed border-[#7c3aed]/40 bg-[#7c3aed]/10 p-2.5 text-center text-[11px] text-muted-foreground">
              Live demo — admin@aivideo.io / demo1234
            </p>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="mt-5 space-y-3">
            <Field label="Full name">
              <input value={rName} onChange={(e) => setRName(e.target.value)} className="auth-input" required />
            </Field>
            <Field label="Work email">
              <input type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} className="auth-input" required />
            </Field>
            <Field label="Password" hint="8+ characters">
              <input type="password" value={rPass} onChange={(e) => setRPass(e.target.value)} className="auth-input" required />
            </Field>
            <Field label="Default content language">
              <select value={rLang} onChange={(e) => setRLang(e.target.value)} className="auth-input">
                <option value="en-US">English (US)</option>
                <option value="en-UK">English (UK)</option>
                <option value="bn-BD">Bengali</option>
                <option value="es-ES">Spanish</option>
                <option value="hi-IN">Hindi</option>
              </select>
            </Field>
            <button type="submit" disabled={busy} className="auth-btn">
              {busy ? "Creating…" : "Create my account →"}
            </button>
          </form>
        )}

        <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info("SSO is not configured in this demo")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-[#0e1119] px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-[#2563eb] hover:text-foreground"
          >
            <Youtube className="h-4 w-4" /> Google
          </button>
          <button
            onClick={() => toast.info("SSO is not configured in this demo")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-[#0e1119] px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-[#2563eb] hover:text-foreground"
          >
            <Facebook className="h-4 w-4" /> GitHub
          </button>
        </div>
      </div>

      <style>{`
        .auth-input{width:100%;padding:11px 13px;background:#0e1119;border:1px solid #2a3146;border-radius:10px;outline:none;color:#e7eaf3;font-size:14px}
        .auth-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px #2563eb33}
        .auth-btn{width:100%;padding:12px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4);color:#fff;font-weight:700;font-size:14px;transition:.18s;box-shadow:0 8px 22px -10px #2563ebcc}
        .auth-btn:hover{transform:translateY(-1px)}
        .auth-btn:disabled{opacity:.6;cursor:wait}
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
