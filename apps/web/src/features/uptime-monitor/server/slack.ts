import "server-only";

export type UptimeAlertEvent = {
  kind: "down" | "recovery";
  monitorName: string;
  monitorUrl: string;
  occurredAt: string;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
};

export type SlackIncomingWebhookPayload = {
  text: string;
  blocks: SlackBlock[];
};

type SlackBlock =
  | {
      type: "header";
      text: { type: "plain_text"; text: string; emoji?: boolean };
    }
  | {
      type: "section";
      fields: Array<{ type: "mrkdwn"; text: string }>;
    }
  | {
      type: "section";
      text: { type: "mrkdwn"; text: string };
    };

export type SendSlackWebhookResult = { ok: true } | { ok: false; message: string };

type SlackDeps = {
  fetchImpl?: typeof fetch;
};

function field(label: string, value: string): { type: "mrkdwn"; text: string } {
  return { type: "mrkdwn", text: `*${label}:*\n${value}` };
}

function formatOccurredAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString();
}

function statusLabel(kind: UptimeAlertEvent["kind"]): string {
  return kind === "down" ? "Down" : "Recovered";
}

function statusEmoji(kind: UptimeAlertEvent["kind"]): string {
  return kind === "down" ? "🔴" : "🟢";
}

/** Builds the Incoming Webhook payload for a down or recovery alert. */
export function formatSlackAlertPayload(event: UptimeAlertEvent): SlackIncomingWebhookPayload {
  const status = statusLabel(event.kind);
  const emoji = statusEmoji(event.kind);
  const text =
    event.kind === "down"
      ? `${emoji} ${event.monitorName} is down`
      : `${emoji} ${event.monitorName} recovered`;

  const fields = [
    field("Status", status),
    field("Monitor", event.monitorName),
    field("URL", event.monitorUrl),
    field("Time", formatOccurredAt(event.occurredAt)),
  ];

  if (event.statusCode !== null) {
    fields.push(field("Status code", String(event.statusCode)));
  }
  if (event.error) {
    fields.push(field("Error", event.error));
  }
  if (event.latencyMs !== null) {
    fields.push(field("Latency", `${event.latencyMs} ms`));
  }

  return {
    text,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: event.kind === "down" ? "Monitor down" : "Monitor recovered",
          emoji: true,
        },
      },
      {
        type: "section",
        fields,
      },
    ],
  };
}

/** Builds the Incoming Webhook payload for a configuration test message. */
export function formatSlackTestPayload(): SlackIncomingWebhookPayload {
  return {
    text: "✅ Forge Uptime Monitor: test message. Slack alerts are configured correctly.",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Slack test message", emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "✅ Forge Uptime Monitor: test message. Slack alerts are configured correctly.",
        },
      },
    ],
  };
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim().slice(0, 200);
  }
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }
  return `Slack request failed with status ${status}.`;
}

/**
 * Posts a payload to a Slack Incoming Webhook.
 * Never logs or returns the webhook URL.
 */
export async function sendSlackWebhook(
  webhookUrl: string,
  payload: SlackIncomingWebhookPayload,
  deps: SlackDeps = {},
): Promise<SendSlackWebhookResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Slack request failed.",
    };
  }

  const rawBody = await response.text().catch(() => "");
  let parsedBody: unknown = rawBody;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    return { ok: false, message: errorMessage(parsedBody, response.status) };
  }

  // Slack returns the plain text "ok" on success for Incoming Webhooks.
  if (typeof parsedBody === "string" && parsedBody.trim() && parsedBody.trim() !== "ok") {
    return { ok: false, message: parsedBody.trim().slice(0, 200) };
  }

  return { ok: true };
}
