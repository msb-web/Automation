import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

// Diagnostic endpoint (NOT the deploy healthcheck). Reports whether the
// database layer actually works: schema bootstrap + a count query. Use this
// after the deploy is live to determine if Prisma/SQLite are functioning in
// the platform's runtime. If this returns db:"error", the DB layer needs a
// different driver (e.g. pure bun:sqlite) — but the deploy itself is already
// live because /api/health passed the platform healthcheck.
export const GET = async () => {
  let dbStatus: "ok" | "error" = "ok";
  let detail = "";
  try {
    await ensureSchema();
    const n = await db.videoProject.count();
    detail = `count=${n}`;
  } catch (e) {
    dbStatus = "error";
    detail = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(
    { db: dbStatus, detail, time: new Date().toISOString() },
    { status: 200 }
  );
};
