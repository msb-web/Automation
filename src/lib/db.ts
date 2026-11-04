import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// Self-bootstrap the database connection. The repo `.env` is gitignored, so a
// deploy that doesn't run the Docker entrypoint (which sets DATABASE_URL and
// runs `prisma db push`) starts with no DATABASE_URL and no schema. Default to
// a local SQLite file and ensure its directory exists so the app always has a
// working database regardless of how it is launched.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./db/custom.db";
}
if (process.env.DATABASE_URL.startsWith("file:")) {
  const filePart = process.env.DATABASE_URL.slice("file:".length);
  const dir = path.dirname(filePart);
  if (dir && dir !== "." && !existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch {
      /* directory may already exist or be on a read-only fs; let Prisma surface the real error */
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Construct defensively: if PrismaClient construction throws (e.g. the native
// query engine can't load in the deploy runtime), the module must still load so
// /api/health can respond and the deploy healthcheck passes. DB access in route
// handlers is wrapped in try/catch, so an unavailable client surfaces as a
// caught error rather than a crashed process.
let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;
if (!prismaClient) {
  try {
    prismaClient = new PrismaClient({ log: ["query"] });
  } catch (e) {
    console.error("[db] PrismaClient construction failed:", e);
  }
  if (process.env.NODE_ENV !== "production" && prismaClient) {
    globalForPrisma.prisma = prismaClient;
  }
}
export const db = prismaClient as PrismaClient;

// Idempotent schema bootstrap: create the tables if they don't exist, without
// relying on `prisma db push` having run. Runs once per process; the promise is
// shared so callers can await the same in-flight creation.
const DDL = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL UNIQUE,
    "hashedPassword" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'producer',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en-US',
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "VideoProject" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "voice" TEXT NOT NULL DEFAULT 'en-us-female',
    "narrationSpeed" REAL NOT NULL DEFAULT 1.0,
    "subtitleStyle" TEXT NOT NULL DEFAULT 'minimal',
    "tone" TEXT NOT NULL DEFAULT 'Educational',
    "targetLength" TEXT NOT NULL DEFAULT 'Auto',
    "keywords" TEXT NOT NULL DEFAULT '',
    "musicBed" TEXT NOT NULL DEFAULT 'Auto-match',
    "platforms" TEXT NOT NULL DEFAULT 'youtube,facebook',
    "approvalPolicy" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Script" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL UNIQUE,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedDurationSec" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "WorkflowRun" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "GenerationArtifact" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "assetUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("projectId", "kind"),
    FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PublishRecord" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE
  )`,
];

const bootGlobal = globalThis as unknown as {
  __schemaBootstrap: Promise<void> | null;
};

export function ensureSchema(): Promise<void> {
  if (!bootGlobal.__schemaBootstrap) {
    bootGlobal.__schemaBootstrap = (async () => {
      for (const stmt of DDL) {
        await db.$executeRawUnsafe(stmt);
      }
    })().catch((e) => {
      console.error("[db] schema bootstrap failed:", e);
    });
  }
  return bootGlobal.__schemaBootstrap;
}
