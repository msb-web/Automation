import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "aiva_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-9f3a7c2e1b8d4a6f"
);
const MAX_AGE = 60 * 60 * 24; // 24h

/* ---------- password hashing (scrypt, no native deps) ---------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  return hashBuf.length === test.length && timingSafeEqual(hashBuf, test);
}

/* ---------- JWT ---------- */
export async function signToken(user: { id: number; role: string; email: string }) {
  return new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}
export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as { sub?: string; role?: string; email?: string };
}

/* ---------- cookies ---------- */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* ---------- session helpers ---------- */
export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  defaultLanguage: string;
  isActive: boolean;
  createdAt: Date;
};

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const tok = store.get(SESSION_COOKIE)?.value;
  if (!tok) return null;
  try {
    const payload = await verifyToken(tok);
    const userId = Number(payload.sub);
    if (!userId) return null;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSession();
  if (!u) throw new HttpError(401, "Could not validate credentials");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw new HttpError(403, "Admin privileges required");
  return u;
}

/* Authenticate via shared API key (Authorization: Bearer <key> or x-api-key)
   for n8n / external automations, falling back to the browser session.
   When a valid WEBHOOK_API_KEY is presented, a synthetic admin "Automation"
   identity is returned so the caller can operate on any project. */
export async function authRequest(req: Request): Promise<SessionUser> {
  const key = process.env.WEBHOOK_API_KEY;
  if (key) {
    const auth = req.headers.get("authorization") || "";
    const xKey = req.headers.get("x-api-key") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : xKey;
    if (token) {
      const a = Buffer.from(token);
      const b = Buffer.from(key);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return {
          id: 0, email: "webhook@aivideo.io", name: "Automation", role: "admin",
          defaultLanguage: "en-US", isActive: true, createdAt: new Date(),
        };
      }
    }
  }
  return requireUser();
}

/* ---------- error + response helpers ---------- */
export class HttpError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

export const toUserOut = (u: SessionUser) => {
  const { hashedPassword: _omit, ...rest } = u as SessionUser & {
    hashedPassword?: string;
  };
  return rest;
};
