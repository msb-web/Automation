import fs from "fs";

/* Facebook Graph API integration — chunked resumable video upload to a Page.
   Requires a Page Access Token with pages_manage_posts / pages_read_engagement.
   Mock mode when credentials are absent. */

const FB_GRAPH = "https://graph.facebook.com/v23.0";

export type FBCreds = { pageId?: string; accessToken?: string };

export function fbCreds(): FBCreds {
  return {
    pageId: process.env.FACEBOOK_PAGE_ID,
    accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
  };
}

export function facebookConfigured(): boolean {
  const c = fbCreds();
  return Boolean(c.pageId && c.accessToken);
}

export async function uploadFacebookVideo(opts: {
  videoPath: string;
  description: string;
  title?: string;
}): Promise<{ id: string; url: string; status: "published" | "mock" }> {
  if (!facebookConfigured()) {
    const id = `fb_mock_${Math.random().toString(36).slice(2, 10)}`;
    return {
      id,
      url: `https://www.facebook.com/${fbCreds().pageId || "page"}/videos/${id}`,
      status: "mock",
    };
  }
  const c = fbCreds() as Required<FBCreds>;
  const size = fs.statSync(opts.videoPath).size;

  const startRes = await fetch(`${FB_GRAPH}/${c.pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_phase: "start",
      file_size: String(size),
      access_token: c.accessToken,
    }),
  });
  if (!startRes.ok) throw new Error(`FB upload start failed: ${startRes.status}`);
  const start = (await startRes.json()) as {
    upload_session_id: string; video_id: string;
    start_offset: string; chunk_size: string;
  };

  const buf = fs.readFileSync(opts.videoPath);
  let offset = parseInt(start.start_offset, 10) || 0;
  const chunkSize = parseInt(start.chunk_size, 10) || size;
  while (offset < size) {
    const end = Math.min(offset + chunkSize, size);
    const fd = new FormData();
    fd.append("upload_phase", "transfer");
    fd.append("offset", String(offset));
    fd.append("upload_session_id", start.upload_session_id);
    fd.append("access_token", c.accessToken);
    fd.append("video_file_chunk", new Blob([buf.subarray(offset, end)], { type: "video/mp4" }), "chunk.mp4");
    const tr = await fetch(`${FB_GRAPH}/${c.pageId}/videos`, { method: "POST", body: fd });
    if (!tr.ok) throw new Error(`FB chunk transfer failed: ${tr.status}`);
    const tj = (await tr.json()) as { start_offset?: string };
    offset = tj.start_offset ? parseInt(tj.start_offset, 10) : end;
  }

  const fin = await fetch(`${FB_GRAPH}/${c.pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_phase: "finish",
      upload_session_id: start.upload_session_id,
      access_token: c.accessToken,
      description: opts.description,
      title: opts.title,
    }),
  });
  if (!fin.ok) throw new Error(`FB upload finish failed: ${fin.status}`);
  return {
    id: String(start.video_id),
    url: `https://www.facebook.com/${c.pageId}/videos/${start.video_id}`,
    status: "published",
  };
}
