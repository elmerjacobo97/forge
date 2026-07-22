import "server-only";

import {
  formatSlackAlertPayload,
  sendSlackWebhook,
  type UptimeAlertEvent,
} from "./slack";
import { sendTelegramMessage } from "./telegram";

export type { UptimeAlertEvent };

export type NotificationDeliveryResult = {
  channel: "telegram" | "slack";
  ok: boolean;
  error?: string;
};

export type UptimeNotificationChannelSettings = {
  telegramBotToken: string | null;
  telegramChatId: string | null;
  slackWebhookUrl: string | null;
  slackEnabled: boolean;
};

export type DispatchUptimeAlertDeps = {
  sendTelegram?: typeof sendTelegramMessage;
  sendSlack?: typeof sendSlackWebhook;
};

/** Preserves the Telegram alert text used before the multi-channel dispatcher. */
export function formatTelegramAlertText(event: UptimeAlertEvent): string {
  if (event.kind === "down") {
    return `🔴 ${event.monitorName} is down (${event.error ?? "check failed"}).\n${event.monitorUrl}`;
  }
  return `🟢 ${event.monitorName} recovered.\n${event.monitorUrl}`;
}

function logDeliveryFailure(
  channel: NotificationDeliveryResult["channel"],
  monitorName: string,
  message: string,
): void {
  console.error(`[uptime-monitor] ${channel} alert failed for ${monitorName}: ${message}`);
}

async function deliverTelegram(
  event: UptimeAlertEvent,
  settings: UptimeNotificationChannelSettings,
  sendTelegram: typeof sendTelegramMessage,
): Promise<NotificationDeliveryResult> {
  try {
    const result = await sendTelegram(
      settings.telegramBotToken as string,
      settings.telegramChatId as string,
      formatTelegramAlertText(event),
    );
    if (!result.ok) {
      logDeliveryFailure("telegram", event.monitorName, result.message);
      return { channel: "telegram", ok: false, error: result.message };
    }
    return { channel: "telegram", ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram request failed.";
    logDeliveryFailure("telegram", event.monitorName, message);
    return { channel: "telegram", ok: false, error: message };
  }
}

async function deliverSlack(
  event: UptimeAlertEvent,
  settings: UptimeNotificationChannelSettings,
  sendSlack: typeof sendSlackWebhook,
): Promise<NotificationDeliveryResult> {
  try {
    const result = await sendSlack(
      settings.slackWebhookUrl as string,
      formatSlackAlertPayload(event),
    );
    if (!result.ok) {
      logDeliveryFailure("slack", event.monitorName, result.message);
      return { channel: "slack", ok: false, error: result.message };
    }
    return { channel: "slack", ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slack request failed.";
    logDeliveryFailure("slack", event.monitorName, message);
    return { channel: "slack", ok: false, error: message };
  }
}

/**
 * Delivers one uptime transition to every configured channel independently.
 * Channel failures are logged and returned; they never throw.
 */
export async function dispatchUptimeAlert(
  event: UptimeAlertEvent,
  settings: UptimeNotificationChannelSettings,
  deps: DispatchUptimeAlertDeps = {},
): Promise<NotificationDeliveryResult[]> {
  const sendTelegram = deps.sendTelegram ?? sendTelegramMessage;
  const sendSlack = deps.sendSlack ?? sendSlackWebhook;

  const telegramConfigured = Boolean(settings.telegramBotToken && settings.telegramChatId);
  const slackConfigured = Boolean(settings.slackEnabled && settings.slackWebhookUrl);

  const deliveries: Array<Promise<NotificationDeliveryResult>> = [];

  if (telegramConfigured) {
    deliveries.push(deliverTelegram(event, settings, sendTelegram));
  }
  if (slackConfigured) {
    deliveries.push(deliverSlack(event, settings, sendSlack));
  }

  return Promise.all(deliveries);
}
