import { z } from "zod";

import { WEBHOOK_BODY_MAX_CHARS } from "../constants";

export const createWebhookEndpointSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Name must be at most 80 characters."),
});

export type CreateWebhookEndpointInput = z.infer<typeof createWebhookEndpointSchema>;

export const webhookEndpointRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  token: z.string().min(32).max(128),
  name: z.string().max(80),
  expires_at: z.string(),
  created_at: z.string(),
});

export const webhookEventRowSchema = z.object({
  id: z.uuid(),
  endpoint_id: z.uuid(),
  method: z.string().min(1).max(16),
  path: z.string().min(1).max(4096),
  headers: z.record(z.string(), z.string()),
  body: z.string().max(WEBHOOK_BODY_MAX_CHARS),
  body_truncated: z.boolean(),
  source_ip: z.string().max(128).nullable(),
  user_agent: z.string().max(1024).nullable(),
  received_at: z.string(),
});
