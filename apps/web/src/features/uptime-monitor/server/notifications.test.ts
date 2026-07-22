import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { formatSlackAlertPayload, type UptimeAlertEvent } from "./slack";
import {
  dispatchUptimeAlert,
  formatTelegramAlertText,
  type UptimeNotificationChannelSettings,
} from "./notifications";

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

const bothChannels: UptimeNotificationChannelSettings = {
  telegramBotToken: "tok",
  telegramChatId: "chat",
  slackWebhookUrl: "https://hooks.slack.com/services/T/B/secret",
  slackEnabled: true,
};

describe("formatTelegramAlertText", () => {
  it("keeps the existing down message shape", () => {
    expect(formatTelegramAlertText(downEvent)).toBe(
      "🔴 API is down (Unexpected status 503).\nhttps://example.com/health",
    );
  });

  it("keeps the existing recovery message shape", () => {
    expect(formatTelegramAlertText(recoveryEvent)).toBe(
      "🟢 API recovered.\nhttps://example.com/health",
    );
  });

  it("falls back to check failed when down has no error", () => {
    expect(formatTelegramAlertText({ ...downEvent, error: null })).toBe(
      "🔴 API is down (check failed).\nhttps://example.com/health",
    );
  });
});

describe("dispatchUptimeAlert", () => {
  it("delivers to Telegram and Slack independently when both are configured", async () => {
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    const results = await dispatchUptimeAlert(downEvent, bothChannels, {
      sendTelegram,
      sendSlack,
    });

    expect(results).toEqual([
      { channel: "telegram", ok: true },
      { channel: "slack", ok: true },
    ]);
    expect(sendTelegram).toHaveBeenCalledWith(
      "tok",
      "chat",
      formatTelegramAlertText(downEvent),
    );
    expect(sendSlack).toHaveBeenCalledWith(
      bothChannels.slackWebhookUrl,
      formatSlackAlertPayload(downEvent),
    );
  });

  it("logs a Slack failure and still delivers Telegram", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: false, message: "invalid_token" });

    const results = await dispatchUptimeAlert(downEvent, bothChannels, {
      sendTelegram,
      sendSlack,
    });

    expect(results).toEqual([
      { channel: "telegram", ok: true },
      { channel: "slack", ok: false, error: "invalid_token" },
    ]);
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[uptime-monitor] slack alert failed for API: invalid_token",
    );
    errorSpy.mockRestore();
  });

  it("logs a Telegram failure and still delivers Slack", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sendTelegram = vi.fn().mockResolvedValue({ ok: false, message: "chat not found" });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    const results = await dispatchUptimeAlert(recoveryEvent, bothChannels, {
      sendTelegram,
      sendSlack,
    });

    expect(results).toEqual([
      { channel: "telegram", ok: false, error: "chat not found" },
      { channel: "slack", ok: true },
    ]);
    expect(sendSlack).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[uptime-monitor] telegram alert failed for API: chat not found",
    );
    errorSpy.mockRestore();
  });

  it("never throws when a channel send rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sendTelegram = vi.fn().mockRejectedValue(new Error("boom"));
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    await expect(
      dispatchUptimeAlert(downEvent, bothChannels, { sendTelegram, sendSlack }),
    ).resolves.toEqual([
      { channel: "telegram", ok: false, error: "boom" },
      { channel: "slack", ok: true },
    ]);

    errorSpy.mockRestore();
  });

  it("skips Slack when disabled or missing a webhook", async () => {
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    const disabled = await dispatchUptimeAlert(
      downEvent,
      { ...bothChannels, slackEnabled: false },
      { sendTelegram, sendSlack },
    );
    expect(disabled).toEqual([{ channel: "telegram", ok: true }]);
    expect(sendSlack).not.toHaveBeenCalled();

    const missingWebhook = await dispatchUptimeAlert(
      downEvent,
      { ...bothChannels, slackWebhookUrl: null },
      { sendTelegram, sendSlack },
    );
    expect(missingWebhook).toEqual([{ channel: "telegram", ok: true }]);
    expect(sendSlack).not.toHaveBeenCalled();
  });

  it("skips Telegram when credentials are missing", async () => {
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    const results = await dispatchUptimeAlert(
      downEvent,
      { ...bothChannels, telegramBotToken: null, telegramChatId: null },
      { sendTelegram, sendSlack },
    );

    expect(results).toEqual([{ channel: "slack", ok: true }]);
    expect(sendTelegram).not.toHaveBeenCalled();
  });

  it("returns an empty list when no channel is configured", async () => {
    const sendTelegram = vi.fn();
    const sendSlack = vi.fn();

    const results = await dispatchUptimeAlert(
      downEvent,
      {
        telegramBotToken: null,
        telegramChatId: null,
        slackWebhookUrl: null,
        slackEnabled: false,
      },
      { sendTelegram, sendSlack },
    );

    expect(results).toEqual([]);
    expect(sendTelegram).not.toHaveBeenCalled();
    expect(sendSlack).not.toHaveBeenCalled();
  });
});
