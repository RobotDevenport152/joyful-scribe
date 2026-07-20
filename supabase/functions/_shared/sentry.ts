// Minimal Sentry error reporter for Edge Functions — a raw envelope POST
// rather than the official SDK. The SDK assumes Node-like APIs that aren't
// guaranteed in Supabase's constrained Deno runtime, and importing it adds
// weight evaluated on every cold start, including on latency-sensitive
// functions like checkout. This has zero import-time cost: it's a no-op
// until SENTRY_DSN is set, same pattern as the Twilio secrets — it ships
// ahead of the Sentry project existing.
//
// Wire format: https://develop.sentry.dev/sdk/data-model/envelopes/

interface CaptureContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

function parseDsn(dsn: string): { ingestUrl: string; publicKey: string } | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!projectId || !url.username) return null;
    return {
      ingestUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

export async function captureException(error: unknown, context: CaptureContext = {}): Promise<void> {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) return;

  const parsed = parseDsn(dsn);
  if (!parsed) {
    console.error("sentry_dsn_invalid");
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = new Date().toISOString();

  const event = {
    event_id: eventId,
    timestamp,
    platform: "other",
    exception: {
      values: [
        {
          type: error instanceof Error ? error.name : "Error",
          value: message,
          stacktrace: error instanceof Error && error.stack
            ? { frames: error.stack.split("\n").slice(1, 10).map((line) => ({ filename: line.trim() })) }
            : undefined,
        },
      ],
    },
    tags: context.tags,
    extra: context.extra,
  };

  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: timestamp }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n") + "\n";

  try {
    await fetch(parsed.ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=pacific-alpacas-edge/1.0`,
      },
      body: envelope,
    });
  } catch (reportError) {
    // Reporting failure must never mask or delay the caller's real error.
    console.error("sentry_report_failed", {
      message: reportError instanceof Error ? reportError.message : String(reportError),
    });
  }
}
