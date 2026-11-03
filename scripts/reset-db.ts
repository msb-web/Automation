// Wipe all rows so /api/seed re-seeds with the corrected buildWorkflow.
// Run: bun scripts/reset-db.ts
import { db } from "../src/lib/db";

async function main() {
  await db.workflowRun.deleteMany();
  await db.script.deleteMany();
  await db.videoProject.deleteMany();
  await db.user.deleteMany();
  console.log("Wiped all rows. Next /api/seed call will reseed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
