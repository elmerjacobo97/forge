import "server-only";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  WEBHOOK_MAX_ENDPOINTS_PER_USER,
} from "../constants";
import {
  createWebhookEndpointSchema,
  webhookEndpointRowSchema,
  webhookEventRowSchema,
  type CreateWebhookEndpointInput,
} from "../schemas/webhook-inspector-schema";
import type { WebhookEndpoint, WebhookEvent } from "../types";
import {
  assertCanCreateEndpoint,
  buildEndpointExpiresAt,
} from "../utils/limits";
import { generateWebhookToken } from "../utils/token";

const ENDPOINT_COLUMNS =
  "id,user_id,token,name,expires_at,created_at" as const;
const EVENT_COLUMNS =
  "id,endpoint_id,method,path,headers,body,body_truncated,source_ip,user_agent,received_at" as const;

function requireUser(userId?: string): asserts userId is string {
  if (!userId) throw new Error("Sign in to use Webhook Inspector.");
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function toEndpoint(value: unknown): WebhookEndpoint {
  const row = webhookEndpointRowSchema.parse(value);
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    name: row.name,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function toEvent(value: unknown): WebhookEvent {
  const row = webhookEventRowSchema.parse(value);
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    method: row.method,
    path: row.path,
    headers: row.headers,
    body: row.body,
    bodyTruncated: row.body_truncated,
    sourceIp: row.source_ip,
    userAgent: row.user_agent,
    receivedAt: row.received_at,
  };
}

async function countActiveEndpoints(
  database: Awaited<ReturnType<typeof createInsForgeServerClient>>["database"],
  nowIso: string,
): Promise<number> {
  const { count, error } = await database
    .from("webhook_endpoints")
    .select("id", { count: "exact", head: true })
    .gt("expires_at", nowIso);
  if (error) throw failure(error, "Failed to check webhook endpoint limit.");
  return count ?? 0;
}

export const webhookInspectorService = {
  async listEndpoints(userId?: string): Promise<WebhookEndpoint[]> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("webhook_endpoints")
      .select(ENDPOINT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load webhook endpoints.");
    return webhookEndpointRowSchema.array().parse(data).map(toEndpoint);
  },

  async createEndpoint(
    input: CreateWebhookEndpointInput | unknown,
    userId?: string,
  ): Promise<WebhookEndpoint> {
    requireUser(userId);
    const { name } = createWebhookEndpointSchema.parse(input ?? { name: "" });
    const insforge = await createInsForgeServerClient();
    const now = new Date();
    const activeCount = await countActiveEndpoints(
      insforge.database,
      now.toISOString(),
    );
    assertCanCreateEndpoint(activeCount);

    const token = generateWebhookToken();
    const expiresAt = buildEndpointExpiresAt(now);

    const { data, error } = await insforge.database
      .from("webhook_endpoints")
      .insert([
        {
          user_id: userId,
          token,
          name,
          expires_at: expiresAt,
        },
      ])
      .select(ENDPOINT_COLUMNS)
      .single();
    if (error) {
      if (error.message?.toLowerCase().includes("limit")) {
        throw failure(
          error,
          `You can have at most ${WEBHOOK_MAX_ENDPOINTS_PER_USER} active webhook endpoints.`,
        );
      }
      throw failure(error, "Failed to create webhook endpoint.");
    }
    return toEndpoint(data);
  },

  async deleteEndpoint(endpointId: string, userId?: string): Promise<void> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database
      .from("webhook_endpoints")
      .delete()
      .eq("id", endpointId);
    if (error) throw failure(error, "Failed to delete webhook endpoint.");
  },

  async listEvents(
    endpointId: string,
    userId?: string,
  ): Promise<WebhookEvent[]> {
    requireUser(userId);
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("webhook_events")
      .select(EVENT_COLUMNS)
      .eq("endpoint_id", endpointId)
      .order("received_at", { ascending: false });
    if (error) throw failure(error, "Failed to load webhook events.");
    return webhookEventRowSchema.array().parse(data).map(toEvent);
  },
};
