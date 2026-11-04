/* In-process scheduler fallback. The primary trigger is the /api/publish/tick
   route called by n8n's Schedule node; this interval covers the demo when no
   external cron is wired up. Guarded against duplicate intervals under HMR. */
import { tickDuePublishes } from "./index";

const G = globalThis as unknown as { __publishScheduler?: boolean };

if (!G.__publishScheduler && process.env.NODE_ENV !== "test") {
  G.__publishScheduler = true;
  setInterval(() => {
    tickDuePublishes().catch((e) => console.error("[scheduler] tick failed", e));
  }, 60_000);
}
