/* Event notifier — posts a JSON payload to a configured incoming webhook
   (Slack / Discord / Teams / n8n webhook node). When no webhook URL is set,
   events are logged so the pipeline still records what happened. */

export type NotifyEvent =
  | "pipeline.started" | "pipeline.failed" | "video.ready"
  | "approval.requested" | "approval.decision"
  | "publish.scheduled" | "publish.success" | "publish.failed";

export async function notify(
  event: NotifyEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  const body = { event, at: new Date().toISOString(), ...payload };
  if (!url) {
    console.log(`[notify] ${event} ${JSON.stringify(payload)}`);
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`[notify] ${event} delivery failed`, e);
  }
}
