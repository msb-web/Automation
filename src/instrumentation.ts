// Next.js instrumentation hook — runs once when the Node server starts.
// Starts the in-process publish scheduler as a fallback for when no external
// cron (n8n Schedule node) is calling /api/publish/tick.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/publish/scheduler");
  }
}
