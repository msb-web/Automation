import { handle } from "@/lib/route";
import { requireUser } from "@/lib/auth";
import { publishConfig } from "@/lib/publish";

// Reports which platform credentials are configured (live) vs mock mode.
export const GET = () =>
  handle(async () => {
    await requireUser();
    return publishConfig();
  });
