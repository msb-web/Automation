import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { HttpError, type SessionUser } from "@/lib/auth";
import type { Project } from "@/lib/types";

/** Wrap a route handler: maps HttpError -> JSON {detail}, catches the rest as 500. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    const data = await fn();
    // Routes that need a custom status return a Response/NextResponse directly — pass through.
    if (data instanceof Response) return data;
    if (data === undefined) return NextResponse.json({ ok: true });
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof HttpError)
      return NextResponse.json({ detail: e.message }, { status: e.status });
    console.error("[api error]", e);
    return NextResponse.json(
      { detail: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function parseBody<T = Record<string, unknown>>(
  req: Request
): Promise<T> {
  return (await req.json()) as T;
}

/** Fetch a project, enforcing ownership (admins see everything). */
export async function getOwnedProject(id: number, user: SessionUser) {
  const proj = await db.videoProject.findUnique({
    where: { id },
    include: {
      script: true,
      workflowRuns: { orderBy: { id: "asc" } },
    },
  });
  if (!proj) throw new HttpError(404, "Project not found");
  if (proj.userId !== user.id && user.role !== "admin")
    throw new HttpError(403, "Not your project");
  // Prisma stores `status` as String and timestamps as DateTime; the app's
  // Project type narrows status to ProjectStatus and models timestamps as
  // ISO strings (the API-serialised shape). The values are valid at runtime,
  // and the backend never reads createdAt/updatedAt as strings, so cast at
  // this single boundary rather than at every call site.
  return proj as unknown as Project & {
    script: typeof proj.script;
    workflowRuns: typeof proj.workflowRuns;
  };
}
