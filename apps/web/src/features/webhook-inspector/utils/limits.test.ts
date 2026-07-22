import { describe, expect, it } from "vitest";

import {
  WEBHOOK_ENDPOINT_TTL_MS,
  WEBHOOK_MAX_ENDPOINTS_PER_USER,
} from "../constants";
import { createWebhookEndpointSchema } from "../schemas/webhook-inspector-schema";
import {
  assertCanCreateEndpoint,
  buildEndpointExpiresAt,
  isEndpointExpired,
  WebhookEndpointLimitError,
} from "./limits";
import { buildWebhookPublicUrl } from "./public-url";
import { generateWebhookToken } from "./token";

describe("webhook inspector limits", () => {
  it("allows create while under the active endpoint cap", () => {
    expect(() =>
      assertCanCreateEndpoint(WEBHOOK_MAX_ENDPOINTS_PER_USER - 1),
    ).not.toThrow();
  });

  it("rejects a 6th active endpoint with a clear error", () => {
    expect(() =>
      assertCanCreateEndpoint(WEBHOOK_MAX_ENDPOINTS_PER_USER),
    ).toThrow(WebhookEndpointLimitError);
    expect(() =>
      assertCanCreateEndpoint(WEBHOOK_MAX_ENDPOINTS_PER_USER),
    ).toThrow(/at most 5 active webhook endpoints/i);
  });

  it("treats expires_at at or before now as expired", () => {
    const now = new Date("2026-07-20T12:00:00.000Z");
    expect(isEndpointExpired("2026-07-20T12:00:00.000Z", now)).toBe(true);
    expect(isEndpointExpired("2026-07-20T11:59:59.000Z", now)).toBe(true);
    expect(isEndpointExpired("2026-07-20T12:00:01.000Z", now)).toBe(false);
  });

  it("builds expires_at as now + 7 days", () => {
    const now = new Date("2026-07-20T00:00:00.000Z");
    expect(buildEndpointExpiresAt(now)).toBe(
      new Date(now.getTime() + WEBHOOK_ENDPOINT_TTL_MS).toISOString(),
    );
  });
});

describe("webhook inspector validation", () => {
  it("accepts an empty or short optional name", () => {
    expect(createWebhookEndpointSchema.parse({ name: "" })).toEqual({
      name: "",
    });
    expect(createWebhookEndpointSchema.parse({ name: "  Stripe  " })).toEqual({
      name: "Stripe",
    });
  });

  it("rejects names longer than 80 characters", () => {
    expect(() =>
      createWebhookEndpointSchema.parse({ name: "x".repeat(81) }),
    ).toThrow(/at most 80/i);
  });
});

describe("webhook inspector token and public URL", () => {
  it("generates a 64-char hex token", () => {
    const token = generateWebhookToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(generateWebhookToken()).not.toBe(token);
  });

  it("builds the public capture URL from NEXT_PUBLIC_APP_URL", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://forge.example/";
    try {
      expect(buildWebhookPublicUrl("abc")).toBe(
        "https://forge.example/api/hooks/abc",
      );
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });
});
