import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/insforge/admin", () => ({
  createInsForgeAdminClient: vi.fn(),
}));

import {
  WEBHOOK_BODY_MAX_CHARS,
  WEBHOOK_MAX_EVENTS_PER_ENDPOINT,
  WEBHOOK_RATE_LIMIT_PER_MINUTE,
} from "../constants";
import {
  receiveWebhookRequest,
  type ReceiveWebhookDeps,
} from "./receive-webhook";
import {
  rateLimitWindowStart,
  truncateWebhookBody,
} from "../utils/receive";

const TOKEN = "a".repeat(64);
const ENDPOINT_ID = "550e8400-e29b-41d4-a716-446655440001";
const NOW = new Date("2026-07-20T12:34:56.789Z");

type MockState = {
  rateCount: number | null;
  endpoint: { id: string; token: string; expires_at: string } | null;
  eventCount: number;
  inserts: unknown[];
};

function createMockDatabase(state: MockState) {
  return {
    from(table: string) {
      if (table === "webhook_rate_limits") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data:
                    state.rateCount === null
                      ? null
                      : {
                          token: TOKEN,
                          window_start: rateLimitWindowStart(NOW),
                          request_count: state.rateCount,
                        },
                  error: null,
                }),
              }),
            }),
          }),
          insert: async (rows: unknown[]) => {
            state.rateCount = 1;
            state.inserts.push({ table, rows });
            return { error: null };
          },
          update: () => ({
            eq: () => ({
              eq: async () => {
                state.rateCount = (state.rateCount ?? 0) + 1;
                return { error: null };
              },
            }),
          }),
        };
      }

      if (table === "webhook_endpoints") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: state.endpoint,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "webhook_events") {
        return {
          select: () => ({
            eq: async () => ({
              count: state.eventCount,
              error: null,
            }),
          }),
          insert: async (rows: unknown[]) => {
            state.inserts.push({ table, rows });
            state.eventCount += 1;
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

function createAdmin(
  state: MockState,
): NonNullable<ReceiveWebhookDeps["createAdminClient"]> {
  return (() => ({
    database: createMockDatabase(state),
  })) as unknown as NonNullable<ReceiveWebhookDeps["createAdminClient"]>;
}

function activeEndpoint(
  expiresAt = "2026-07-27T00:00:00.000Z",
): MockState["endpoint"] {
  return { id: ENDPOINT_ID, token: TOKEN, expires_at: expiresAt };
}

function request(init?: RequestInit & { url?: string }) {
  return new Request(init?.url ?? `http://localhost/api/hooks/${TOKEN}?x=1`, {
    method: init?.method ?? "POST",
    headers: init?.headers ?? {
      "content-type": "application/json",
      "user-agent": "curl/8",
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    },
    body: init?.body ?? '{"a":1}',
  });
}

describe("truncateWebhookBody", () => {
  it("leaves short bodies untouched", () => {
    expect(truncateWebhookBody("hello")).toEqual({
      body: "hello",
      bodyTruncated: false,
    });
  });

  it("truncates bodies over 64 KB and sets the flag", () => {
    const raw = "x".repeat(WEBHOOK_BODY_MAX_CHARS + 10);
    const result = truncateWebhookBody(raw);
    expect(result.bodyTruncated).toBe(true);
    expect(result.body).toHaveLength(WEBHOOK_BODY_MAX_CHARS);
    expect(result.body).toBe(raw.slice(0, WEBHOOK_BODY_MAX_CHARS));
  });
});

describe("receiveWebhookRequest", () => {
  it("returns 404 for an invalid token shape without writing events", async () => {
    const state: MockState = {
      rateCount: null,
      endpoint: null,
      eventCount: 0,
      inserts: [],
    };
    const response = await receiveWebhookRequest(request(), "short", {
      createAdminClient: createAdmin(state),
      now: () => NOW,
    });
    expect(response.status).toBe(404);
    expect(state.inserts).toEqual([]);
  });

  it("returns 404 for an unknown token", async () => {
    const state: MockState = {
      rateCount: null,
      endpoint: null,
      eventCount: 0,
      inserts: [],
    };
    const response = await receiveWebhookRequest(request(), TOKEN, {
      createAdminClient: createAdmin(state),
      now: () => NOW,
      readBody: async () => '{"a":1}',
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "not_found" });
    expect(state.inserts.some((row) => (row as { table: string }).table === "webhook_events")).toBe(
      false,
    );
  });

  it("returns 404 for an expired endpoint and does not insert an event", async () => {
    const state: MockState = {
      rateCount: null,
      endpoint: activeEndpoint("2026-07-20T12:00:00.000Z"),
      eventCount: 0,
      inserts: [],
    };
    const response = await receiveWebhookRequest(request(), TOKEN, {
      createAdminClient: createAdmin(state),
      now: () => NOW,
      readBody: async () => '{"a":1}',
    });
    expect(response.status).toBe(404);
    expect(
      state.inserts.filter((row) => (row as { table: string }).table === "webhook_events"),
    ).toHaveLength(0);
  });

  it("returns 429 when the token is over the per-minute rate limit", async () => {
    const state: MockState = {
      rateCount: WEBHOOK_RATE_LIMIT_PER_MINUTE,
      endpoint: activeEndpoint(),
      eventCount: 0,
      inserts: [],
    };
    const response = await receiveWebhookRequest(request(), TOKEN, {
      createAdminClient: createAdmin(state),
      now: () => NOW,
      readBody: async () => '{"a":1}',
    });
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ error: "rate_limited" });
    expect(
      state.inserts.filter((row) => (row as { table: string }).table === "webhook_events"),
    ).toHaveLength(0);
  });

  it("returns 507 when the endpoint already has 100 events", async () => {
    const state: MockState = {
      rateCount: null,
      endpoint: activeEndpoint(),
      eventCount: WEBHOOK_MAX_EVENTS_PER_ENDPOINT,
      inserts: [],
    };
    const response = await receiveWebhookRequest(request(), TOKEN, {
      createAdminClient: createAdmin(state),
      now: () => NOW,
      readBody: async () => '{"a":1}',
    });
    expect(response.status).toBe(507);
    await expect(response.json()).resolves.toMatchObject({ error: "event_limit" });
    expect(
      state.inserts.filter((row) => (row as { table: string }).table === "webhook_events"),
    ).toHaveLength(0);
  });

  it("stores a truncated body and returns 200 { ok: true }", async () => {
    const state: MockState = {
      rateCount: null,
      endpoint: activeEndpoint(),
      eventCount: 3,
      inserts: [],
    };
    const raw = "y".repeat(WEBHOOK_BODY_MAX_CHARS + 25);
    const response = await receiveWebhookRequest(request({ method: "PUT" }), TOKEN, {
      createAdminClient: createAdmin(state),
      now: () => NOW,
      readBody: async () => raw,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });

    const eventInsert = state.inserts.find(
      (row) => (row as { table: string }).table === "webhook_events",
    ) as { table: string; rows: Array<Record<string, unknown>> };
    expect(eventInsert.rows[0]).toMatchObject({
      endpoint_id: ENDPOINT_ID,
      method: "PUT",
      path: `/api/hooks/${TOKEN}?x=1`,
      body_truncated: true,
      source_ip: "203.0.113.9",
      user_agent: "curl/8",
    });
    expect(eventInsert.rows[0]?.body).toHaveLength(WEBHOOK_BODY_MAX_CHARS);
  });

  it("accepts a normal POST and persists method/path/headers/body", async () => {
    const state: MockState = {
      rateCount: 2,
      endpoint: activeEndpoint(),
      eventCount: 0,
      inserts: [],
    };
    const response = await receiveWebhookRequest(request(), TOKEN, {
      createAdminClient: createAdmin(state),
      now: () => NOW,
      readBody: async () => '{"a":1}',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(state.rateCount).toBe(3);

    const eventInsert = state.inserts.find(
      (row) => (row as { table: string }).table === "webhook_events",
    ) as { table: string; rows: Array<Record<string, unknown>> };
    expect(eventInsert.rows[0]).toMatchObject({
      method: "POST",
      body: '{"a":1}',
      body_truncated: false,
      headers: expect.objectContaining({
        "content-type": "application/json",
      }),
    });
  });
});
