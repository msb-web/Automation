import path from "path";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { uploadYouTubeVideo, youtubeConfigured } from "./youtube";
import { uploadFacebookVideo, facebookConfigured as fbConfigured } from "./facebook";
import type { Project } from "@/lib/types";

const genDir = (id: number) => path.join(process.cwd(), "public", "gen", String(id));
const longVideoPath = (id: number) => path.join(genDir(id), "video-long.mp4");

export function publishConfig() {
  return {
    youtube: youtubeConfigured(),
    facebook: fbConfigured(),
    notifyWebhook: Boolean(process.env.NOTIFY_WEBHOOK_URL),
    mode: youtubeConfigured() || fbConfigured() ? "live" : "mock",
  };
}

/** Publish a video to the given platforms immediately. Creates a PublishRecord
 *  per platform, uploads, and records the result. */
export async function publishToPlatforms(
  project: Project,
  platforms: string[]
): Promise<{ records: Array<{ platform: string; status: string; url?: string; externalId?: string; error?: string }> }> {
  const videoPath = longVideoPath(project.id);
  const records: Array<{ platform: string; status: string; url?: string; externalId?: string; error?: string }> = [];
  const tags = project.keywords
    ? project.keywords.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  for (const p of platforms) {
    const rec = await db.publishRecord.create({
      data: { projectId: project.id, platform: p, status: "pending" },
    });
    try {
      let r: { id: string; url: string; status: "published" | "mock" };
      if (p === "youtube") {
        r = await uploadYouTubeVideo({
          videoPath, title: project.title,
          description: `${project.topic}\n\n#${project.niche}`, tags,
        });
      } else if (p === "facebook") {
        r = await uploadFacebookVideo({
          videoPath, title: project.title,
          description: `${project.title} — ${project.topic}`,
        });
      } else {
        await db.publishRecord.update({
          where: { id: rec.id },
          data: { status: "failed", error: `Unknown platform: ${p}` },
        });
        records.push({ platform: p, status: "failed", error: `Unknown platform: ${p}` });
        continue;
      }
      await db.publishRecord.update({
        where: { id: rec.id },
        data: { externalId: r.id, url: r.url, status: "published", publishedAt: new Date() },
      });
      records.push({ platform: p, status: r.status, url: r.url, externalId: r.id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.publishRecord.update({
        where: { id: rec.id },
        data: { status: "failed", error: msg },
      });
      records.push({ platform: p, status: "failed", error: msg });
      await notify("publish.failed", { projectId: project.id, platform: p, error: msg });
    }
  }

  const okCount = records.filter((r) => r.status === "published" || r.status === "mock").length;
  if (okCount > 0) {
    await db.videoProject.update({ where: { id: project.id }, data: { status: "published" } });
    await db.workflowRun.create({
      data: { projectId: project.id, stage: "publish", status: "done", progress: 100, startedAt: new Date(), finishedAt: new Date() },
    });
    await notify("publish.success", {
      projectId: project.id, title: project.title,
      platforms: records.filter((r) => r.status !== "failed").map((r) => r.platform),
    });
  }
  return { records };
}

/** Schedule a publish for a future time. Creates PublishRecords with status=scheduled. */
export async function schedulePublish(
  project: Project,
  platforms: string[],
  scheduledAt: Date
): Promise<void> {
  for (const p of platforms) {
    await db.publishRecord.create({
      data: { projectId: project.id, platform: p, status: "scheduled", scheduledAt },
    });
  }
  await notify("publish.scheduled", {
    projectId: project.id, title: project.title,
    platforms, at: scheduledAt.toISOString(),
  });
}

/** Process all scheduled publishes that are due. Called by the /api/publish/tick
 *  route (n8n cron) and by the in-process scheduler interval. */
export async function tickDuePublishes(): Promise<number> {
  const due = await db.publishRecord.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    include: { project: true },
  });
  if (!due.length) return 0;
  let processed = 0;
  for (const rec of due) {
    processed++;
    try {
      const videoPath = longVideoPath(rec.projectId);
      let r: { id: string; url: string };
      if (rec.platform === "youtube") {
        r = await uploadYouTubeVideo({
          videoPath, title: rec.project.title,
          description: `${rec.project.topic}\n\n#${rec.project.niche}`,
        });
      } else if (rec.platform === "facebook") {
        r = await uploadFacebookVideo({
          videoPath, description: `${rec.project.title} — ${rec.project.topic}`,
        });
      } else continue;
      await db.publishRecord.update({
        where: { id: rec.id },
        data: { externalId: r.id, url: r.url, status: "published", publishedAt: new Date() },
      });
      await notify("publish.success", { projectId: rec.projectId, platform: rec.platform, scheduled: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.publishRecord.update({
        where: { id: rec.id },
        data: { status: "failed", error: msg },
      });
      await notify("publish.failed", { projectId: rec.projectId, platform: rec.platform, error: msg });
    }
  }
  // Flip projects whose records are all settled to published.
  const projectIds = [...new Set(due.map((d) => d.projectId))];
  for (const pid of projectIds) {
    const pending = await db.publishRecord.count({
      where: { projectId: pid, status: { in: ["scheduled", "pending"] } },
    });
    if (pending === 0) {
      const hasOk = await db.publishRecord.count({ where: { projectId: pid, status: "published" } });
      if (hasOk > 0) {
        await db.videoProject.update({ where: { id: pid }, data: { status: "published" } });
        await db.workflowRun.create({
          data: { projectId: pid, stage: "publish", status: "done", progress: 100, startedAt: new Date(), finishedAt: new Date() },
        });
      }
    }
  }
  return processed;
}
