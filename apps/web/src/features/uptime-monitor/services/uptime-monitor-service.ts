import "server-only";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type {
  CreateUptimeMonitorInput,
  NotificationSettingsInput,
} from "../schemas/uptime-monitor-schema";
import {
  createUptimeMonitorSchema,
  notificationSettingsSchema,
  uptimeCheckRowSchema,
  uptimeIncidentRowSchema,
  uptimeMonitorRowSchema,
  uptimeNotificationSettingsRowSchema,
} from "../schemas/uptime-monitor-schema";
import type {
  UptimeCheck,
  UptimeIncident,
  UptimeMonitor,
  UptimeNotificationSettings,
} from "../types";
import { assertCanCreateMonitor } from "../utils/limits";

const MONITOR_COLUMNS =
  "id,user_id,name,url,method,expected_status,interval_minutes,failure_threshold,enabled,status,consecutive_failures,last_checked_at,created_at" as const;
const CHECK_COLUMNS = "id,monitor_id,ok,status_code,latency_ms,error,checked_at" as const;
const INCIDENT_COLUMNS = "id,monitor_id,started_at,ended_at" as const;
const SETTINGS_COLUMNS = "user_id,telegram_bot_token,telegram_chat_id,updated_at" as const;

function requireUser(userId?: string): asserts userId is string {
  if (!userId) throw new Error("Sign in to use Uptime Monitor.");
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function toMonitor(value: unknown): UptimeMonitor {
  const row = uptimeMonitorRowSchema.parse(value);
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    url: row.url,
    method: row.method,
    expectedStatus: row.expected_status,
    intervalMinutes: row.interval_minutes,
    failureThreshold: row.failure_threshold,
    enabled: row.enabled,
    status: row.status,
    consecutiveFailures: row.consecutive_failures,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
  };
}

function toCheck(value: unknown): UptimeCheck {
  const row = uptimeCheckRowSchema.parse(value);
  return {
    id: row.id,
    monitorId: row.monitor_id,
    ok: row.ok,
    statusCode: row.status_code,
    latencyMs: row.latency_ms,
    error: row.error,
    checkedAt: row.checked_at,
  };
}

function toIncident(value: unknown): UptimeIncident {
  const row = uptimeIncidentRowSchema.parse(value);
  return {
    id: row.id,
    monitorId: row.monitor_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

function toSettings(value: unknown): UptimeNotificationSettings {
  const row = uptimeNotificationSettingsRowSchema.parse(value);
  return {
    userId: row.user_id,
    telegramBotToken: row.telegram_bot_token,
    telegramChatId: row.telegram_chat_id,
    updatedAt: row.updated_at,
  };
}

function toMonitorPayload(input: CreateUptimeMonitorInput) {
  return {
    name: input.name,
    url: input.url,
    method: input.method,
    expected_status: input.expectedStatus,
    interval_minutes: input.intervalMinutes,
    failure_threshold: input.failureThreshold,
  };
}

async function countMonitors(
  database: Awaited<ReturnType<typeof createInsForgeServerClient>>["database"],
): Promise<number> {
  const { count, error } = await database
    .from("uptime_monitors")
    .select("id", { count: "exact", head: true });
  if (error) throw failure(error, "Failed to check monitor limit.");
  return count ?? 0;
}

export const uptimeMonitorService = {
  async listMonitors(userId?: string): Promise<UptimeMonitor[]> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_monitors")
      .select(MONITOR_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load monitors.");
    return uptimeMonitorRowSchema.array().parse(data).map(toMonitor);
  },

  async createMonitor(
    input: CreateUptimeMonitorInput | unknown,
    userId?: string,
  ): Promise<UptimeMonitor> {
    requireUser(userId);
    const parsed = createUptimeMonitorSchema.parse(input);
    const insforge = await createInsForgeServerClient();

    const existingCount = await countMonitors(insforge.database);
    assertCanCreateMonitor(existingCount);

    const { data, error } = await insforge.database
      .from("uptime_monitors")
      .insert([{ user_id: userId, ...toMonitorPayload(parsed) }])
      .select(MONITOR_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to create monitor.");
    return toMonitor(data);
  },

  async updateMonitor(
    monitorId: string,
    input: CreateUptimeMonitorInput | unknown,
    userId?: string,
  ): Promise<UptimeMonitor> {
    requireUser(userId);
    const parsed = createUptimeMonitorSchema.parse(input);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_monitors")
      .update(toMonitorPayload(parsed))
      .eq("id", monitorId)
      .select(MONITOR_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to update monitor.");
    return toMonitor(data);
  },

  async setMonitorEnabled(
    monitorId: string,
    enabled: boolean,
    userId?: string,
  ): Promise<UptimeMonitor> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_monitors")
      .update({ enabled })
      .eq("id", monitorId)
      .select(MONITOR_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to update monitor.");
    return toMonitor(data);
  },

  async deleteMonitor(monitorId: string, userId?: string): Promise<void> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("uptime_monitors").delete().eq("id", monitorId);
    if (error) throw failure(error, "Failed to delete monitor.");
  },

  async listChecks(
    monitorId: string,
    userId?: string,
    options: { sinceIso?: string; limit?: number } = {},
  ): Promise<UptimeCheck[]> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    let query = insforge.database
      .from("uptime_checks")
      .select(CHECK_COLUMNS)
      .eq("monitor_id", monitorId);
    if (options.sinceIso) query = query.gte("checked_at", options.sinceIso);
    query = query.order("checked_at", { ascending: false });
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw failure(error, "Failed to load checks.");
    return uptimeCheckRowSchema.array().parse(data).map(toCheck);
  },

  async listIncidents(monitorId: string, userId?: string): Promise<UptimeIncident[]> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_incidents")
      .select(INCIDENT_COLUMNS)
      .eq("monitor_id", monitorId)
      .order("started_at", { ascending: false });
    if (error) throw failure(error, "Failed to load incidents.");
    return uptimeIncidentRowSchema.array().parse(data).map(toIncident);
  },

  async getNotificationSettings(userId?: string): Promise<UptimeNotificationSettings | null> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_notification_settings")
      .select(SETTINGS_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw failure(error, "Failed to load notification settings.");
    return data ? toSettings(data) : null;
  },

  async saveNotificationSettings(
    input: NotificationSettingsInput | unknown,
    userId?: string,
  ): Promise<UptimeNotificationSettings> {
    requireUser(userId);
    const parsed = notificationSettingsSchema.parse(input);
    const insforge = await createInsForgeServerClient();
    const payload = {
      telegram_bot_token: parsed.telegramBotToken,
      telegram_chat_id: parsed.telegramChatId,
    };

    const { data: existing, error: selectError } = await insforge.database
      .from("uptime_notification_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (selectError) {
      throw failure(selectError, "Failed to load notification settings.");
    }

    if (existing) {
      const { data, error } = await insforge.database
        .from("uptime_notification_settings")
        .update(payload)
        .eq("user_id", userId)
        .select(SETTINGS_COLUMNS)
        .single();
      if (error) throw failure(error, "Failed to save notification settings.");
      return toSettings(data);
    }

    const { data, error } = await insforge.database
      .from("uptime_notification_settings")
      .insert([{ user_id: userId, ...payload }])
      .select(SETTINGS_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to save notification settings.");
    return toSettings(data);
  },
};
