import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  formatSlackAlertPayload,
  formatSlackTestPayload,
  sendSlackWebhook,
  type UptimeAlertEvent,
} from "./slack";

const downEvent: UptimeAlertEvent = {
  kind: "down",
  monitorName: "API",
  monitorUrl: "https://example.com/health",
  occurredAt: "2026-07-22T12:00:00.000Z",
  statusCode: 503,
  latencyMs: 120,
  error: "Unexpected status 503",
};

const recoveryEvent: UptimeAlertEvent = {
  kind: "recovery",
  monitorName: "API",
  monitorUrl: "https://example.com/health",
  occurredAt: "2026-07-22T12:05:00.000Z",
  statusCode: 200,
  latencyMs: 45,
  error: null,
};

describe("formatSlackAlertPayload", () => {
  it("builds fallback text and blocks for a down alert", () => {
    const payload = formatSlackAlertPayload(downEvent);

    expect(payload.text).toBe("🔴 API is down");
    expect(payload.blocks[0]).toEqual({
      type: "header",
      text: { type: "plain_text", text: "Monitor down", emoji: true },
    });

    const section = payload.blocks[1];
    expect(section.type).toBe("section");
    if (section.type !== "section" || !("fields" in section)) {
      throw new Error("expected section with fields");
    }

    const fieldTexts = section.fields.map((field) => field.text);
    expect(fieldTexts).toEqual(
      expect.arrayContaining([
        "*Status:*\nDown",
        "*Monitor:*\nAPI",
        "*URL:*\nhttps://example.com/health",
        "*Time:*\n2026-07-22T12:00:00.000Z",
        "*Status code:*\n503",
        "*Error:*\nUnexpected status 503",
        "*Latency:*\n120 ms",
      ]),
    );
  });

  it("builds fallback text and blocks for a recovery alert", () => {
    const payload = formatSlackAlertPayload(recoveryEvent);

    expect(payload.text).toBe("🟢 API recovered");
    expect(payload.blocks[0]).toEqual({
      type: "header",
      text: { type: "plain_text", text: "Monitor recovered", emoji: true },
    });

    const section = payload.blocks[1];
    expect(section.type).toBe("section");
    if (section.type !== "section" || !("fields" in section)) {
      throw new Error("expected section with fields");
    }

    const fieldTexts = section.fields.map((field) => field.text);
    expect(fieldTexts).toEqual(
      expect.arrayContaining([
        "*Status:*\nRecovered",
        "*Monitor:*\nAPI",
        "*URL:*\nhttps://example.com/health",
        "*Time:*\n2026-07-22T12:05:00.000Z",
        "*Status code:*\n200",
        "*Latency:*\n45 ms",
      ]),
    );
    expect(fieldTexts.some((text) => text.startsWith("*Error:*"))).toBe(false);
  });

  it("omits status code and latency when null", () => {
    const payload = formatSlackAlertPayload({
      ...downEvent,
      statusCode: null,
      latencyMs: null,
      error: "timeout",
    });

    const section = payload.blocks[1];
    if (section.type !== "section" || !("fields" in section)) {
      throw new Error("expected section with fields");
    }

    const fieldTexts = section.fields.map((field) => field.text);
    expect(fieldTexts.some((text) => text.startsWith("*Status code:*"))).toBe(false);
    expect(fieldTexts.some((text) => text.startsWith("*Latency:*"))).toBe(false);
    expect(fieldTexts).toContain("*Error:*\ntimeout");
  });
});

describe("formatSlackTestPayload", () => {
  it("builds fallback text and a confirmation block", () => {
    const payload = formatSlackTestPayload();

    expect(payload.text).toContain("test message");
    expect(payload.blocks[0]).toEqual({
      type: "header",
      text: { type: "plain_text", text: "Slack test message", emoji: true },
    });
    expect(payload.blocks[1]).toEqual({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "✅ Forge Uptime Monitor: test message. Slack alerts are configured correctly.",
      },
    });
  });
});

describe("sendSlackWebhook", () => {
  const webhookUrl = "https://hooks.slack.com/services/T/B/secret";
  const payload = formatSlackTestPayload();

  it("posts the payload and returns ok on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const result = await sendSlackWebhook(webhookUrl, payload, { fetchImpl });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      webhookUrl,
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("returns the Slack error string on a non-2xx JSON response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
      }),
    );

    const result = await sendSlackWebhook(webhookUrl, payload, { fetchImpl });

    expect(result).toEqual({ ok: false, message: "invalid_payload" });
  });

  it("returns a generic message when the error body is empty", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 500 }));

    const result = await sendSlackWebhook(webhookUrl, payload, { fetchImpl });

    expect(result).toEqual({
      ok: false,
      message: "Slack request failed with status 500.",
    });
  });

  it("returns plain-text error bodies from Slack", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("invalid_token", { status: 403 }));

    const result = await sendSlackWebhook(webhookUrl, payload, { fetchImpl });

    expect(result).toEqual({ ok: false, message: "invalid_token" });
  });

  it("returns a failure result when fetch rejects (network error)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await sendSlackWebhook(webhookUrl, payload, { fetchImpl });

    expect(result).toEqual({ ok: false, message: "network down" });
  });
});
