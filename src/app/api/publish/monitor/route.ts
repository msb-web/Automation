import { handle } from "@/lib/route";
import { authRequest } from "@/lib/auth";
import { db } from "@/lib/db";

// Publish monitoring metrics — accepts a session (UI) or the API key (n8n /
// external dashboards). Returns success rate, scheduled count, recent
// failures, and recent successful publishes.
export const GET = (req: Request) =>
  handle(async () => {
    await authRequest(req);

    const statusGroups = await db.publishRecord.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const platGroups = await db.publishRecord.groupBy({
      by: ["platform"],
      _count: { _all: true },
    });

    const byStatus: Record<string, number> = { published: 0, scheduled: 0, failed: 0, pending: 0 };
    const byPlatform: Record<string, number> = { youtube: 0, facebook: 0 };
    for (const g of statusGroups) byStatus[g.status] = g._count._all;
    for (const g of platGroups) byPlatform[g.platform] = g._count._all;

    const settled = byStatus.published + byStatus.failed;
    const successRate = settled ? Math.round((byStatus.published / settled) * 100) : null;

    const recentFailures = await db.publishRecord.findMany({
      where: { status: "failed" },
      orderBy: { id: "desc" },
      take: 5,
      select: { projectId: true, platform: true, error: true, updatedAt: true },
    });
    const recentPublishes = await db.publishRecord.findMany({
      where: { status: "published" },
      orderBy: { id: "desc" },
      take: 5,
      select: { projectId: true, platform: true, url: true, publishedAt: true },
    });

    return {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      byStatus,
      byPlatform,
      successRate,
      scheduled: byStatus.scheduled,
      failed: byStatus.failed,
      published: byStatus.published,
      recentFailures,
      recentPublishes,
    };
  });
