"use server";

import { ZodError } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { notificationSettingsSchema } from "./schemas/uptime-monitor-schema";
import { sendTelegramMessage } from "./server/telegram";
import { uptimeMonitorService } from "./services/uptime-monitor-service";
import type {
  UptimeCheck,
  UptimeIncident,
  UptimeMonitor,
  UptimeNotificationSettings,
} from "./types";
import { UptimeMonitorLimitError } from "./utils/limits";

export type UptimeActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

function actionError(error: unknown, fallback: string): UptimeActionResult<never> {
  if (error instanceof UptimeMonitorLimitError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof ZodError) {
    return {
      ok: false,
      message: error.issues[0]?.message ?? "Invalid input.",
    };
  }
  if (error instanceof Error && error.message) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: fallback };
}

async function requireAuthUser(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to use Uptime Monitor." };
  return { ok: true, userId: user.id };
}

export async function createUptimeMonitorAction(
  input: unknown,
): Promise<UptimeActionResult<UptimeMonitor>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  try {
    const monitor = await uptimeMonitorService.createMonitor(input, auth.userId);
    return { ok: true, data: monitor };
  } catch (error) {
    return actionError(error, "Failed to create monitor.");
  }
}

export async function updateUptimeMonitorAction(
  monitorId: unknown,
  input: unknown,
): Promise<UptimeActionResult<UptimeMonitor>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  if (typeof monitorId !== "string" || monitorId.length === 0) {
    return { ok: false, message: "Invalid monitor." };
  }

  try {
    const monitor = await uptimeMonitorService.updateMonitor(monitorId, input, auth.userId);
    return { ok: true, data: monitor };
  } catch (error) {
    return actionError(error, "Failed to update monitor.");
  }
}

export async function setUptimeMonitorEnabledAction(
  monitorId: unknown,
  enabled: unknown,
): Promise<UptimeActionResult<UptimeMonitor>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  if (typeof monitorId !== "string" || monitorId.length === 0) {
    return { ok: false, message: "Invalid monitor." };
  }
  if (typeof enabled !== "boolean") {
    return { ok: false, message: "Invalid monitor state." };
  }

  try {
    const monitor = await uptimeMonitorService.setMonitorEnabled(monitorId, enabled, auth.userId);
    return { ok: true, data: monitor };
  } catch (error) {
    return actionError(error, "Failed to update monitor.");
  }
}

export async function deleteUptimeMonitorAction(monitorId: unknown): Promise<UptimeActionResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  if (typeof monitorId !== "string" || monitorId.length === 0) {
    return { ok: false, message: "Invalid monitor." };
  }

  try {
    await uptimeMonitorService.deleteMonitor(monitorId, auth.userId);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Failed to delete monitor.");
  }
}

export async function listUptimeMonitorsAction(): Promise<UptimeActionResult<UptimeMonitor[]>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  try {
    const monitors = await uptimeMonitorService.listMonitors(auth.userId);
    return { ok: true, data: monitors };
  } catch (error) {
    return actionError(error, "Failed to load monitors.");
  }
}

export async function listUptimeChecksAction(
  monitorId: unknown,
  options?: { sinceIso?: string; limit?: number },
): Promise<UptimeActionResult<UptimeCheck[]>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  if (typeof monitorId !== "string" || monitorId.length === 0) {
    return { ok: false, message: "Invalid monitor." };
  }

  try {
    const checks = await uptimeMonitorService.listChecks(monitorId, auth.userId, options);
    return { ok: true, data: checks };
  } catch (error) {
    return actionError(error, "Failed to load checks.");
  }
}

export async function listUptimeIncidentsAction(
  monitorId: unknown,
): Promise<UptimeActionResult<UptimeIncident[]>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  if (typeof monitorId !== "string" || monitorId.length === 0) {
    return { ok: false, message: "Invalid monitor." };
  }

  try {
    const incidents = await uptimeMonitorService.listIncidents(monitorId, auth.userId);
    return { ok: true, data: incidents };
  } catch (error) {
    return actionError(error, "Failed to load incidents.");
  }
}

export async function getNotificationSettingsAction(): Promise<
  UptimeActionResult<UptimeNotificationSettings | null>
> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  try {
    const settings = await uptimeMonitorService.getNotificationSettings(auth.userId);
    return { ok: true, data: settings };
  } catch (error) {
    return actionError(error, "Failed to load notification settings.");
  }
}

export async function saveNotificationSettingsAction(
  input: unknown,
): Promise<UptimeActionResult<UptimeNotificationSettings>> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  const parsed = notificationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid notification settings.",
    };
  }

  try {
    const settings = await uptimeMonitorService.saveNotificationSettings(parsed.data, auth.userId);
    return { ok: true, data: settings };
  } catch (error) {
    return actionError(error, "Failed to save notification settings.");
  }
}

export async function sendTestTelegramMessageAction(): Promise<UptimeActionResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth;

  const settings = await uptimeMonitorService.getNotificationSettings(auth.userId);
  if (!settings?.telegramBotToken || !settings.telegramChatId) {
    return {
      ok: false,
      message: "Save a Telegram bot token and chat ID first.",
    };
  }

  const result = await sendTelegramMessage(
    settings.telegramBotToken,
    settings.telegramChatId,
    "✅ Forge Uptime Monitor: test message. Telegram alerts are configured correctly.",
  );
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true, data: undefined };
}
