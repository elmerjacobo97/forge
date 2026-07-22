import "server-only";

import type { InsForgeClient } from "@insforge/sdk";

import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import {
  WEBHOOK_MAX_EVENTS_PER_ENDPOINT,
  WEBHOOK_RATE_LIMIT_PER_MINUTE,
} from "../constants";
import { isEndpointExpired } from "../utils/limits";
import {
  headersToRecord,
  rateLimitWindowStart,
  requestPathWithQuery,
  sourceIpFromHeaders,
  truncateWebhookBody,
} from "../utils/receive";

type AdminDatabase = InsForgeClient["database"];

export type ReceiveWebhookDeps = {
  createAdminClient?: typeof createInsForgeAdminClient;
  now?: () => Date;
  readBody?: (request: Request) => Promise<string>;
};

async function enforceRateLimit(
  database: AdminDatabase,
  token: string,
  windowStart: string,
): Promise<Response | null> {
  const { data: existing, error: selectError } = await database
    .from("webhook_rate_limits")
    .select("token,window_start,request_count")
    .eq("token", token)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (selectError) {
    return Response.json(
      { error: "rate_limit_unavailable", message: "Rate limit check failed." },
      { status: 503 },
    );
  }

  const currentCount =
    existing && typeof existing === "object" && "request_count" in existing
      ? Number(existing.request_count)
      : 0;

  if (currentCount >= WEBHOOK_RATE_LIMIT_PER_MINUTE) {
    return Response.json(
      {
        error: "rate_limited",
        message: `Rate limit exceeded (${WEBHOOK_RATE_LIMIT_PER_MINUTE} requests per minute).`,
      },
      { status: 429 },
    );
  }

  if (!existing) {
    const { error: insertError } = await database.from("webhook_rate_limits").insert([
      { token, window_start: windowStart, request_count: 1 },
    ]);
    if (insertError) {
      // Concurrent first insert: treat as busy and re-check via update path next request.
      return Response.json(
        { error: "rate_limit_unavailable", message: "Rate limit check failed." },
        { status: 503 },
      );
    }
    return null;
  }

  const { error: updateError } = await database
    .from("webhook_rate_limits")
    .update({ request_count: currentCount + 1 })
    .eq("token", token)
    .eq("window_start", windowStart);

  if (updateError) {
    return Response.json(
      { error: "rate_limit_unavailable", message: "Rate limit check failed." },
      { status: 503 },
    );
  }

  return null;
}

async function defaultReadBody(request: Request): Promise<string> {
  try {
    return await request.text();
  } catch {
    return "";
  }
}

export async function receiveWebhookRequest(
  request: Request,
  token: string,
  deps: ReceiveWebhookDeps = {},
): Promise<Response> {
  if (!token || token.length < 32 || token.length > 128) {
    return Response.json(
      { error: "not_found", message: "Webhook endpoint not found." },
      { status: 404 },
    );
  }

  const createAdmin = deps.createAdminClient ?? createInsForgeAdminClient;
  const now = (deps.now ?? (() => new Date()))();
  const readBody = deps.readBody ?? defaultReadBody;

  let admin: ReturnType<typeof createInsForgeAdminClient>;
  try {
    admin = createAdmin();
  } catch {
    return Response.json(
      { error: "misconfigured", message: "Webhook receiver is misconfigured." },
      { status: 503 },
    );
  }

  const database = admin.database;
  const windowStart = rateLimitWindowStart(now);

  const rateLimited = await enforceRateLimit(database, token, windowStart);
  if (rateLimited) return rateLimited;

  const { data: endpoint, error: endpointError } = await database
    .from("webhook_endpoints")
    .select("id,token,expires_at")
    .eq("token", token)
    .maybeSingle();

  if (endpointError || !endpoint || typeof endpoint !== "object") {
    return Response.json(
      { error: "not_found", message: "Webhook endpoint not found." },
      { status: 404 },
    );
  }

  const endpointRow = endpoint as { id: string; token: string; expires_at: string };
  if (isEndpointExpired(endpointRow.expires_at, now)) {
    return Response.json(
      { error: "not_found", message: "Webhook endpoint not found." },
      { status: 404 },
    );
  }

  const { count, error: countError } = await database
    .from("webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("endpoint_id", endpointRow.id);

  if (countError) {
    return Response.json(
      { error: "unavailable", message: "Could not check event capacity." },
      { status: 503 },
    );
  }

  if ((count ?? 0) >= WEBHOOK_MAX_EVENTS_PER_ENDPOINT) {
    return Response.json(
      {
        error: "event_limit",
        message: `This endpoint has reached the maximum of ${WEBHOOK_MAX_EVENTS_PER_ENDPOINT} events.`,
      },
      { status: 507 },
    );
  }

  const url = new URL(request.url);
  const rawBody = await readBody(request);
  const { body, bodyTruncated } = truncateWebhookBody(rawBody);
  const userAgent = request.headers.get("user-agent");

  const { error: insertError } = await database.from("webhook_events").insert([
    {
      endpoint_id: endpointRow.id,
      method: request.method.slice(0, 16),
      path: requestPathWithQuery(url).slice(0, 4096),
      headers: headersToRecord(request.headers),
      body,
      body_truncated: bodyTruncated,
      source_ip: sourceIpFromHeaders(request.headers),
      user_agent: userAgent ? userAgent.slice(0, 1024) : null,
    },
  ]);

  if (insertError) {
    return Response.json(
      { error: "persist_failed", message: "Failed to store webhook event." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true }, { status: 200 });
}
