import { handle } from "@/lib/route";
import { ensureSeed } from "@/lib/seed";

// GET is supported so the seed can be triggered from a browser address bar
// during local testing (e.g. open http://localhost:3000/api/seed). ensureSeed
// is idempotent — repeated calls report "Already seeded" and make no changes.
export const GET = () =>
  handle(async () => {
    const seeded = await ensureSeed();
    return {
      message: seeded ? "Database seeded" : "Already seeded",
      seeded,
    };
  });

export const POST = () =>
  handle(async () => {
    const seeded = await ensureSeed();
    return {
      message: seeded ? "Database seeded" : "Already seeded",
      seeded,
    };
  });
