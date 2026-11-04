export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

type Opts = { method?: string; body?: unknown; headers?: Record<string, string> };

async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  let r: Response;
  try {
    r = await fetch(path, {
      method: opts.method || "GET",
      headers,
      credentials: "same-origin",
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError("Network error — cannot reach server", 0);
  }
  if (r.status === 401) throw new ApiError("Session expired", 401);
  if (!r.ok) {
    let detail = r.statusText || `HTTP ${r.status}`;
    try {
      const j = await r.json();
      detail = Array.isArray(j.detail)
        ? j.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join("; ")
        : j.detail || JSON.stringify(j);
    } catch {}
    throw new ApiError(detail, r.status);
  }
  if (r.status === 204) return null as T;
  return (await r.json()) as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) => request<T>(p, { method: "POST", body }),
  put: <T>(p: string, body?: unknown) => request<T>(p, { method: "PUT", body }),
  patch: <T>(p: string, body?: unknown) => request<T>(p, { method: "PATCH", body }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};
