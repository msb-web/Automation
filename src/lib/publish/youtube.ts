import fs from "fs";

/* YouTube Data API v3 integration — OAuth2 + resumable upload.
   Credentials come from env vars obtained via the Google OAuth consent flow
   (see buildAuthUrl / exchangeCode). When credentials are absent the module
   runs in MOCK mode so the full pipeline can be exercised end-to-end in dev. */

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YT_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

export type YouTubeCreds = {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
};

export function youtubeCreds(): YouTubeCreds {
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN,
  };
}

export function youtubeConfigured(): boolean {
  const c = youtubeCreds();
  return Boolean(c.clientId && c.clientSecret && c.refreshToken);
}

/** Google OAuth consent URL — complete in a browser to obtain an auth code. */
export function buildAuthUrl(redirectUri: string, state = ""): string {
  const c = youtubeCreds();
  const params = new URLSearchParams({
    client_id: c.clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${OAUTH_AUTH_URL}?${params}`;
}

/** Exchange an auth code for tokens (refresh + access). */
export async function exchangeCode(code: string, redirectUri: string) {
  const c = youtubeCreds();
  if (!c.clientId || !c.clientSecret)
    throw new Error("YouTube OAuth client not configured");
  const r = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) throw new Error(`YouTube code exchange failed: ${r.status}`);
  return r.json();
}

async function refreshAccessToken(): Promise<string | null> {
  const c = youtubeCreds();
  if (!c.clientId || !c.clientSecret || !c.refreshToken) return null;
  const r = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`YouTube token refresh failed: ${r.status}`);
  return (await r.json()).access_token;
}

export type UploadResult = { id: string; url: string; status: "published" | "mock" };

export async function uploadYouTubeVideo(opts: {
  videoPath: string;
  title: string;
  description: string;
  tags?: string[];
  privacy?: "public" | "unlisted" | "private";
}): Promise<UploadResult> {
  if (!youtubeConfigured()) {
    const id = `yt_mock_${Math.random().toString(36).slice(2, 10)}`;
    return { id, url: `https://youtu.be/${id}`, status: "mock" };
  }
  const token = await refreshAccessToken();
  if (!token) throw new Error("No YouTube access token available");
  const meta = {
    snippet: {
      title: opts.title.slice(0, 100),
      description: opts.description,
      tags: opts.tags,
      categoryId: "22",
    },
    status: { privacyStatus: opts.privacy || "public" },
  };
  const start = await fetch(
    `${YT_UPLOAD_URL}?uploadType=resumable&part=snippet,status`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(meta),
    }
  );
  if (!start.ok) throw new Error(`YouTube upload init failed: ${start.status}`);
  const loc = start.headers.get("location");
  if (!loc) throw new Error("YouTube did not return an upload location");
  const buf = fs.readFileSync(opts.videoPath);
  const put = await fetch(loc, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(buf.byteLength) },
    body: buf,
  });
  if (!put.ok) throw new Error(`YouTube upload failed: ${put.status}`);
  const j = (await put.json()) as { id: string };
  return { id: j.id, url: `https://youtu.be/${j.id}`, status: "published" };
}
