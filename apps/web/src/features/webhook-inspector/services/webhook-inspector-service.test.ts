import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() =>
  vi.fn(async () => ({ database })),
);

vi.mock("@/lib/insforge/server", () => ({
  createInsForgeServerClient,
}));

vi.mock("../utils/token", () => ({
  generateWebhookToken: () => "a".repeat(64),
}));

import { webhookInspectorService } from "./webhook-inspector-service";

const userId = "550e8400-e29b-41d4-a716-446655440000";
const endpointId = "550e8400-e29b-41d4-a716-446655440001";

const endpointRow = {
  id: endpointId,
  user_id: userId,
  token: "a".repeat(64),
  name: "Stripe",
  expires_at: "2026-07-27T00:00:00.000Z",
  created_at: "2026-07-20T00:00:00.000Z",
};

const eventRow = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  endpoint_id: endpointId,
  method: "POST",
  path: "/api/hooks/token?x=1",
  headers: { "content-type": "application/json" },
  body: '{"a":1}',
  body_truncated: false,
  source_ip: "1.2.3.4",
  user_agent: "curl/8",
  received_at: "2026-07-20T01:00:00.000Z",
};

describe("webhookInspectorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an authenticated user", async () => {
    await expect(webhookInspectorService.listEndpoints()).rejects.toThrow(
      "Sign in",
    );
  });

  it("maps endpoint rows from InsForge", async () => {
    const order = vi.fn().mockResolvedValue({ data: [endpointRow], error: null });
    database.from.mockReturnValue({
      select: vi.fn(() => ({ order })),
    });

    await expect(
      webhookInspectorService.listEndpoints(userId),
    ).resolves.toEqual([
      {
        id: endpointId,
        userId,
        token: endpointRow.token,
        name: "Stripe",
        expiresAt: endpointRow.expires_at,
        createdAt: endpointRow.created_at,
      },
    ]);
  });

  it("rejects create when five active endpoints already exist", async () => {
    const countQuery = {
      select: vi.fn(() => ({
        gt: vi.fn().mockResolvedValue({ count: 5, error: null }),
      })),
    };
    database.from.mockReturnValue(countQuery);

    await expect(
      webhookInspectorService.createEndpoint({ name: "Extra" }, userId),
    ).rejects.toThrow(/at most 5 active webhook endpoints/i);
  });

  it("creates an endpoint when under the active cap", async () => {
    const insertSingle = vi
      .fn()
      .mockResolvedValue({ data: endpointRow, error: null });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));

    database.from
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          gt: vi.fn().mockResolvedValue({ count: 2, error: null }),
        })),
      })
      .mockReturnValueOnce({ insert });

    await expect(
      webhookInspectorService.createEndpoint({ name: " Stripe " }, userId),
    ).resolves.toMatchObject({
      id: endpointId,
      name: "Stripe",
      token: "a".repeat(64),
    });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: userId,
        name: "Stripe",
        token: "a".repeat(64),
      }),
    ]);
  });

  it("deletes an endpoint by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    database.from.mockReturnValue({
      delete: vi.fn(() => ({ eq })),
    });

    await expect(
      webhookInspectorService.deleteEndpoint(endpointId, userId),
    ).resolves.toBeUndefined();
    expect(eq).toHaveBeenCalledWith("id", endpointId);
  });

  it("maps event rows for an endpoint", async () => {
    const order = vi.fn().mockResolvedValue({ data: [eventRow], error: null });
    const eq = vi.fn(() => ({ order }));
    database.from.mockReturnValue({
      select: vi.fn(() => ({ eq })),
    });

    await expect(
      webhookInspectorService.listEvents(endpointId, userId),
    ).resolves.toEqual([
      {
        id: eventRow.id,
        endpointId,
        method: "POST",
        path: eventRow.path,
        headers: eventRow.headers,
        body: eventRow.body,
        bodyTruncated: false,
        sourceIp: "1.2.3.4",
        userAgent: "curl/8",
        receivedAt: eventRow.received_at,
      },
    ]);
    expect(eq).toHaveBeenCalledWith("endpoint_id", endpointId);
  });
});
