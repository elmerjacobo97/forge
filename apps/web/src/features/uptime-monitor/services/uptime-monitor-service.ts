import "server-only";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type {
  CreateUptimeMonitorInput,
  NotificationSettingsInput,
  SlackNotificationSettingsInput,
} from "../schemas/uptime-monitor-schema";
import {
  createUptimeMonitorSchema,
  dailyUptimeRowSchema,
  latencyBucketRowSchema,
  latencyRangeSchema,
  notificationSettingsSchema,
  slackNotificationSettingsSchema,
  sparklineBucketRowSchema,
  uptimeCheckRowSchema,
  uptimeIncidentRowSchema,
  uptimeMonitorRowSchema,
  uptimeNotificationSettingsRowSchema,
} from "../schemas/uptime-monitor-schema";
import type {
  DailyUptime,
  LatencyBucket,
  LatencyRange,
  MonitorSparkline,
  SlackNotificationSettings,
  UptimeCheck,
  UptimeIncident,
  UptimeMonitor,
  UptimeNotificationSettings,
  UptimeStatsSummary,
} from "../types";
import { assertCanCreateMonitor } from "../utils/limits";

const MONITOR_COLUMNS =
  "id,user_id,name,url,method,expected_status,interval_minutes,failure_threshold,enabled,status,consecutive_failures,last_checked_at,created_at" as const;
const CHECK_COLUMNS = "id,monitor_id,ok,status_code,latency_ms,error,checked_at" as const;
const INCIDENT_COLUMNS = "id,monitor_id,started_at,ended_at" as const;
const SETTINGS_COLUMNS = "user_id,telegram_bot_token,telegram_chat_id,updated_at" as const;
const SLACK_SETTINGS_COLUMNS =
  "user_id,slack_webhook_url,slack_enabled,updated_at" as const;

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

const slackSettingsRowSchema = uptimeNotificationSettingsRowSchema.pick({
  user_id: true,
  slack_webhook_url: true,
  slack_enabled: true,
  updated_at: true,
});

type SlackNotificationSettingsServer = {
  slackWebhookUrl: string | null;
  slackEnabled: boolean;
};

function toSlackSettings(value: unknown): SlackNotificationSettings {
  const row = slackSettingsRowSchema.parse(value);
  return {
    userId: row.user_id,
    slackConfigured: Boolean(row.slack_webhook_url),
    slackEnabled: row.slack_enabled,
    updatedAt: row.updated_at,
  };
}

function toSlackSettingsServer(value: unknown): SlackNotificationSettingsServer {
  const row = slackSettingsRowSchema.parse(value);
  return {
    slackWebhookUrl: row.slack_webhook_url ?? null,
    slackEnabled: row.slack_enabled,
  };
}

function toLatencyBucket(value: unknown): LatencyBucket {
  const row = latencyBucketRowSchema.parse(value);
  return {
    bucketStart: row.bucket_start,
    avgLatencyMs: row.total_count === 0 ? null : row.avg_latency_ms,
    okCount: row.ok_count,
    totalCount: row.total_count,
  };
}

function toDailyUptime(value: unknown): DailyUptime {
  const row = dailyUptimeRowSchema.parse(value);
  return {
    date: row.day.slice(0, 10),
    uptimePercentage: row.total_count === 0 ? null : (row.ok_count / row.total_count) * 100,
    okCount: row.ok_count,
    totalCount: row.total_count,
  };
}

function uptimeFromBuckets(buckets: LatencyBucket[]): number | null {
  let okCount = 0;
  let totalCount = 0;
  for (const bucket of buckets) {
    okCount += bucket.okCount;
    totalCount += bucket.totalCount;
  }
  if (totalCount === 0) return null;
  return (okCount / totalCount) * 100;
}

function groupSparklineRows(monitorIds: string[], rows: unknown[]): MonitorSparkline[] {
  const bucketsByMonitor = new Map<string, LatencyBucket[]>(
    monitorIds.map((id) => [id, []]),
  );
  for (const value of rows) {
    const row = sparklineBucketRowSchema.parse(value);
    const list = bucketsByMonitor.get(row.monitor_id);
    if (!list) continue;
    list.push({
      bucketStart: row.bucket_start,
      avgLatencyMs: row.total_count === 0 ? null : row.avg_latency_ms,
      okCount: row.ok_count,
      totalCount: row.total_count,
    });
  }
  return monitorIds.map((monitorId) => ({
    monitorId,
    buckets: bucketsByMonitor.get(monitorId) ?? [],
  }));
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

  async getSlackNotificationSettings(userId?: string): Promise<SlackNotificationSettings | null> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_notification_settings")
      .select(SLACK_SETTINGS_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw failure(error, "Failed to load Slack notification settings.");
    return data ? toSlackSettings(data) : null;
  },

  async getSlackNotificationSettingsServerOnly(
    userId?: string,
  ): Promise<SlackNotificationSettingsServer | null> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("uptime_notification_settings")
      .select(SLACK_SETTINGS_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw failure(error, "Failed to load Slack notification settings.");
    return data ? toSlackSettingsServer(data) : null;
  },

  async saveSlackNotificationSettings(
    input: SlackNotificationSettingsInput | unknown,
    userId?: string,
  ): Promise<SlackNotificationSettings> {
    requireUser(userId);
    const parsed = slackNotificationSettingsSchema.parse(input);
    const insforge = await createInsForgeServerClient();

    const { data: existingData, error: selectError } = await insforge.database
      .from("uptime_notification_settings")
      .select(SLACK_SETTINGS_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (selectError) {
      throw failure(selectError, "Failed to load Slack notification settings.");
    }

    const existing = existingData ? slackSettingsRowSchema.parse(existingData) : null;
    const slackWebhookUrl = parsed.clearSlackWebhook
      ? null
      : (parsed.slackWebhookUrl ?? existing?.slack_webhook_url ?? null);
    const slackEnabled = parsed.clearSlackWebhook ? false : parsed.slackEnabled;

    if (slackEnabled && !slackWebhookUrl) {
      throw new Error("Save a Slack webhook before enabling Slack notifications.");
    }

    const payload = {
      slack_webhook_url: slackWebhookUrl,
      slack_enabled: slackEnabled,
    };

    if (existing) {
      const { data, error } = await insforge.database
        .from("uptime_notification_settings")
        .update(payload)
        .eq("user_id", userId)
        .select(SLACK_SETTINGS_COLUMNS)
        .single();
      if (error) throw failure(error, "Failed to save Slack notification settings.");
      return toSlackSettings(data);
    }

    const { data, error } = await insforge.database
      .from("uptime_notification_settings")
      .insert([{ user_id: userId, ...payload }])
      .select(SLACK_SETTINGS_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to save Slack notification settings.");
    return toSlackSettings(data);
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

  async getLatencyBuckets(
    monitorId: string,
    range: LatencyRange,
    userId?: string,
  ): Promise<LatencyBucket[]> {
    requireUser(userId);
    const parsedRange = latencyRangeSchema.parse(range);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database.rpc("uptime_latency_buckets", {
      p_monitor_id: monitorId,
      p_range: parsedRange,
    });
    if (error) throw failure(error, "Failed to load latency buckets.");
    return latencyBucketRowSchema.array().parse(data ?? []).map(toLatencyBucket);
  },

  async getDailyUptime(monitorId: string, userId?: string): Promise<DailyUptime[]> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database.rpc("uptime_daily_uptime", {
      p_monitor_id: monitorId,
    });
    if (error) throw failure(error, "Failed to load daily uptime.");
    return dailyUptimeRowSchema.array().parse(data ?? []).map(toDailyUptime);
  },

  async getSparklines(monitorIds: string[], userId?: string): Promise<MonitorSparkline[]> {
    requireUser(userId);
    if (monitorIds.length === 0) return [];
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database.rpc("uptime_sparklines", {
      p_monitor_ids: monitorIds,
    });
    if (error) throw failure(error, "Failed to load sparklines.");
    return groupSparklineRows(monitorIds, data ?? []);
  },

  async getUptimeStats(monitorId: string, userId?: string): Promise<UptimeStatsSummary> {
    requireUser(userId);
    const [buckets24h, buckets7d, buckets30d] = await Promise.all([
      uptimeMonitorService.getLatencyBuckets(monitorId, "24h", userId),
      uptimeMonitorService.getLatencyBuckets(monitorId, "7d", userId),
      uptimeMonitorService.getLatencyBuckets(monitorId, "30d", userId),
    ]);
    return {
      monitorId,
      uptime24h: uptimeFromBuckets(buckets24h),
      uptime7d: uptimeFromBuckets(buckets7d),
      uptime30d: uptimeFromBuckets(buckets30d),
    };
  },
};
