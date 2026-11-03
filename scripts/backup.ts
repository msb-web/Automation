/* Phase 8 — backup script.
   Creates a consistent snapshot of the SQLite database (via VACUUM INTO,
   which correctly handles WAL mode while the server keeps running), the
   generated media assets, and the .env file. Prunes backups older than
   BACKUP_KEEP_DAYS. Run with: bun scripts/backup.ts (or `bun run backup`). */
import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(ROOT, "backups");
const KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS || 14);

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL || "file:./db/custom.db";
  const p = url.replace(/^file:/, "");
  return path.isAbsolute(p) ? p : path.resolve(ROOT, p);
}

function main() {
  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) {
    console.error(`DB not found at ${dbPath} (DATABASE_URL=${process.env.DATABASE_URL})`);
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_DIR, stamp);
  fs.mkdirSync(dest, { recursive: true });

  // 1. Consistent DB snapshot. VACUUM INTO reads a WAL-merged view and writes
  //    a new compacted file — safe to run while the app is serving traffic.
  const dbSnapshot = path.join(dest, "custom.db");
  const sqlite = new Database(dbPath, { readonly: true });
  try {
    sqlite.exec(`VACUUM INTO '${dbSnapshot.replace(/'/g, "''")}'`);
  } finally {
    sqlite.close();
  }

  // 2. Generated media assets (videos / audio / images / scenes).
  const genSrc = path.join(ROOT, "public", "gen");
  if (fs.existsSync(genSrc)) {
    fs.cpSync(genSrc, path.join(dest, "gen"), { recursive: true });
  }

  // 3. Environment file (secrets — keep the backup dir access-restricted).
  const envSrc = path.join(ROOT, ".env");
  if (fs.existsSync(envSrc)) fs.copyFileSync(envSrc, path.join(dest, ".env"));

  // 4. Prune old backups.
  const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
  let pruned = 0;
  if (fs.existsSync(BACKUP_DIR)) {
    for (const name of fs.readdirSync(BACKUP_DIR)) {
      const d = path.join(BACKUP_DIR, name);
      try {
        if (fs.statSync(d).isDirectory() && fs.statSync(d).mtimeMs < cutoff) {
          fs.rmSync(d, { recursive: true, force: true });
          pruned++;
        }
      } catch {
        /* skip unreadable entries */
      }
    }
  }

  const dbSize = fs.statSync(dbSnapshot).size;
  const genSize = fs.existsSync(path.join(dest, "gen"))
    ? totalSize(path.join(dest, "gen"))
    : 0;
  console.log(`Backup complete → ${dest}`);
  console.log(`  database : custom.db (${(dbSize / 1024).toFixed(0)} KB, VACUUM INTO snapshot)`);
  console.log(`  media    : gen/ (${(genSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  env      : ${fs.existsSync(path.join(dest, ".env")) ? "copied" : "absent"}`);
  console.log(`  pruned   : ${pruned} backup(s) older than ${KEEP_DAYS} day(s)`);
}

function totalSize(dir: string): number {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) n += totalSize(p);
    else try { n += fs.statSync(p).size; } catch { /* ignore */ }
  }
  return n;
}

main();
