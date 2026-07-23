import { z } from "zod";

import {
  UPTIME_FAILURE_THRESHOLD_MAX,
  UPTIME_FAILURE_THRESHOLD_MIN,
  UPTIME_INTERVALS_MINUTES,
  UPTIME_NAME_MAX_LENGTH,
  UPTIME_REQUEST_HEADER_DENYLIST,
  UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH,
  UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH,
  UPTIME_REQUEST_HEADERS_MAX,
  UPTIME_URL_MAX_LENGTH,
} from "../constants";
import type { PersistedRequestHeader, RequestHeaderInput, RequestHeaderMetadata } from "../types";
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

const HTTP_TOKEN_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const REQUEST_HEADER_CONTROL_PATTERN = /[\r\n\0]/;
const requestHeaderDenylist = new Set<string>(UPTIME_REQUEST_HEADER_DENYLIST);

const requestHeaderNameSchema = z
  .string()
  .trim()
  .min(1, "Header name is required.")
  .max(
    UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH,
    `Header name must be at most ${UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH} characters.`,
  )
  .regex(HTTP_TOKEN_PATTERN, "Header name must use valid HTTP token characters.")
  .refine((name) => {
    const normalized = name.toLowerCase();
    return !requestHeaderDenylist.has(normalized) && !normalized.startsWith("proxy-");
  }, "This header is managed by the HTTP runtime and cannot be configured.");

const requestHeaderValueSchema = z
  .string()
  .min(1, "Header value is required.")
  .max(
    UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH,
    `Header value must be at most ${UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH} characters.`,
  )
  .refine(
    (value) => !REQUEST_HEADER_CONTROL_PATTERN.test(value),
    "Header value cannot contain CR, LF, or NUL characters.",
  );

export const persistedRequestHeaderSchema: z.ZodType<PersistedRequestHeader> = z.object({
  name: requestHeaderNameSchema,
  value: requestHeaderValueSchema,
});

export const persistedRequestHeadersSchema = z
  .array(persistedRequestHeaderSchema)
  .max(UPTIME_REQUEST_HEADERS_MAX)
  .refine(
    (headers) =>
      new Set(headers.map((header) => header.name.toLowerCase())).size === headers.length,
    "Header names must be unique.",
  );

export const requestHeaderMetadataSchema: z.ZodType<RequestHeaderMetadata> = z.object({
  name: requestHeaderNameSchema,
  configured: z.literal(true),
});

export const requestHeaderInputSchema: z.ZodType<RequestHeaderInput> = z.object({
  name: requestHeaderNameSchema,
  value: requestHeaderValueSchema.nullable(),
});

export const createUptimeMonitorSchema = z
  .object({
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
    requestHeaders: z.array(requestHeaderInputSchema).max(UPTIME_REQUEST_HEADERS_MAX),
  })
  .superRefine((input, context) => {
    const seenNames = new Set<string>();

    input.requestHeaders.forEach((header, index) => {
      const normalized = header.name.toLowerCase();
      if (seenNames.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "Header names must be unique.",
          path: ["requestHeaders", index, "name"],
        });
      }
      seenNames.add(normalized);
    });

    if (input.requestHeaders.length > 0) {
      try {
        if (new URL(input.url).protocol !== "https:") {
          context.addIssue({
            code: "custom",
            message: "Monitors with custom headers must use HTTPS.",
            path: ["url"],
          });
        }
      } catch {
        // monitorUrlSchema reports the invalid URL.
      }
    }
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
      parsed.protocol === "https:" && parsed.hostname === SLACK_WEBHOOK_HOST && parsed.port === ""
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

export type SlackNotificationSettingsInput = z.infer<typeof slackNotificationSettingsSchema>;

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
  request_headers: z.array(persistedRequestHeaderSchema),
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
