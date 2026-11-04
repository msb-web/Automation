import { handle } from "@/lib/route";
import { authRequest } from "@/lib/auth";
import { tickDuePublishes } from "@/lib/publish";

// Called by n8n's Schedule node (POST) every minute, or manually (GET).
// Accepts the WEBHOOK_API_KEY header so n8n can call it without a session.
// Processes every scheduled publish whose scheduledAt has passed.
export const POST = (req: Request) =>
  handle(async () => {
    await authRequest(req);
    const processed = await tickDuePublishes();
    return { processed, at: new Date().toISOString() };
  });

export const GET = (req: Request) =>
  handle(async () => {
    await authRequest(req);
    const processed = await tickDuePublishes();
    return { processed, at: new Date().toISOString() };
  });
