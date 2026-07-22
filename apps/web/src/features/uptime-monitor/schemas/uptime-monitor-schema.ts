import { z } from "zod";

import {
  UPTIME_FAILURE_THRESHOLD_MAX,
  UPTIME_FAILURE_THRESHOLD_MIN,
  UPTIME_INTERVALS_MINUTES,
  UPTIME_NAME_MAX_LENGTH,
  UPTIME_URL_MAX_LENGTH,
} from "../constants";
import { isValidMonitorUrl } from "../utils/url";

export const SLACK_WEBHOOK_HOST = "hooks.slack.com";

const monitorUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required.")
  .max(UPTIME_URL_MAX_LENGTH, `URL must be at most ${UPTIME_URL_MAX_LENGTH} characters.`)
  .refine(isValidMonitorUrl, "URL must be a public http:// or https:// address.");

const monitorNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(UPTIME_NAME_MAX_LENGTH, `Name must be at most ${UPTIME_NAME_MAX_LENGTH} characters.`);

export const createUptimeMonitorSchema = z.object({
  name: monitorNameSchema,
  url: monitorUrlSchema,
  method: z.enum(["GET", "HEAD"]),
  expectedStatus: z.number().int().min(100).max(599),
  intervalMinutes: z.literal(UPTIME_INTERVALS_MINUTES),
  failureThreshold: z
    .number()
    .int()
    .min(UPTIME_FAILURE_THRESHOLD_MIN)
    .max(UPTIME_FAILURE_THRESHOLD_MAX),
});

export type CreateUptimeMonitorInput = z.infer<typeof createUptimeMonitorSchema>;

export const notificationSettingsSchema = z.object({
  telegramBotToken: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  telegramChatId: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;

export function isValidSlackWebhookUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === SLACK_WEBHOOK_HOST &&
      parsed.port === ""
    );
  } catch {
    return false;
  }
}

const slackWebhookUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || isValidSlackWebhookUrl(value), {
    message: "Slack webhook URL must use HTTPS and the hooks.slack.com host.",
  });

export const slackNotificationSettingsSchema = z
  .object({
    slackWebhookUrl: slackWebhookUrlSchema,
    slackEnabled: z.boolean(),
    clearSlackWebhook: z.boolean(),
  })
  .transform((value) => ({
    ...value,
    slackWebhookUrl: value.clearSlackWebhook ? undefined : value.slackWebhookUrl,
    slackEnabled: value.clearSlackWebhook ? false : value.slackEnabled,
  }));

export type SlackNotificationSettingsInput = z.infer<
  typeof slackNotificationSettingsSchema
>;

export const uptimeMonitorRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string(),
  url: z.string(),
  method: z.enum(["GET", "HEAD"]),
  expected_status: z.number().int(),
  interval_minutes: z.literal(UPTIME_INTERVALS_MINUTES),
  failure_threshold: z.number().int(),
  enabled: z.boolean(),
  status: z.enum(["pending", "up", "down"]),
  consecutive_failures: z.number().int(),
  last_checked_at: z.string().nullable(),
  created_at: z.string(),
});

export const uptimeCheckRowSchema = z.object({
  id: z.uuid(),
  monitor_id: z.uuid(),
  ok: z.boolean(),
  status_code: z.number().int().nullable(),
  latency_ms: z.number().int(),
  error: z.string().nullable(),
  checked_at: z.string(),
});

export const uptimeIncidentRowSchema = z.object({
  id: z.uuid(),
  monitor_id: z.uuid(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
});

export const uptimeNotificationSettingsRowSchema = z.object({
  user_id: z.uuid(),
  telegram_bot_token: z.string().nullable(),
  telegram_chat_id: z.string().nullable(),
  slack_webhook_url: z.string().nullable().optional(),
  slack_enabled: z.boolean().default(false),
  updated_at: z.string(),
});

export const latencyRangeSchema = z.enum(["24h", "7d", "30d"]);

export const latencyBucketRowSchema = z.object({
  bucket_start: z.string(),
  avg_latency_ms: z.coerce.number().nullable(),
  ok_count: z.coerce.number().int(),
  total_count: z.coerce.number().int(),
});

export const dailyUptimeRowSchema = z.object({
  day: z.string(),
  ok_count: z.coerce.number().int(),
  total_count: z.coerce.number().int(),
});

export const sparklineBucketRowSchema = latencyBucketRowSchema.extend({
  monitor_id: z.uuid(),
});
