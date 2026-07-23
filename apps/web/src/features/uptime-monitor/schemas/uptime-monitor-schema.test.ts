import { describe, expect, it } from "vitest";

import {
  UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH,
  UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH,
  UPTIME_REQUEST_HEADERS_MAX,
} from "../constants";
import { createUptimeMonitorSchema } from "./uptime-monitor-schema";

const validMonitor = {
  name: "API health",
  url: "https://example.com/health",
  method: "GET" as const,
  expectedStatus: 200,
  intervalMinutes: 5 as const,
  failureThreshold: 2,
  requestHeaders: [{ name: "Authorization", value: "Bearer secret" }],
};

function parsesRequestHeaders(requestHeaders: { name: string; value: string | null }[]) {
  return createUptimeMonitorSchema.safeParse({ ...validMonitor, requestHeaders }).success;
}

describe("createUptimeMonitorSchema request headers", () => {
  it("accepts the maximum number of headers", () => {
    const requestHeaders = Array.from({ length: UPTIME_REQUEST_HEADERS_MAX }, (_, index) => ({
      name: `X-Test-${index}`,
      value: "configured",
    }));

    expect(parsesRequestHeaders(requestHeaders)).toBe(true);
  });

  it("rejects more than the maximum number of headers", () => {
    const requestHeaders = Array.from({ length: UPTIME_REQUEST_HEADERS_MAX + 1 }, (_, index) => ({
      name: `X-Test-${index}`,
      value: "configured",
    }));

    expect(parsesRequestHeaders(requestHeaders)).toBe(false);
  });

  it("enforces header name and value length limits", () => {
    expect(
      parsesRequestHeaders([
        {
          name: `X-${"a".repeat(UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH - 2)}`,
          value: "v".repeat(UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH),
        },
      ]),
    ).toBe(true);
    expect(
      parsesRequestHeaders([
        { name: "a".repeat(UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH + 1), value: "value" },
      ]),
    ).toBe(false);
    expect(
      parsesRequestHeaders([
        { name: "X-Test", value: "v".repeat(UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH + 1) },
      ]),
    ).toBe(false);
  });

  it("rejects duplicate names case-insensitively", () => {
    expect(
      parsesRequestHeaders([
        { name: "Authorization", value: "first" },
        { name: "authorization", value: "second" },
      ]),
    ).toBe(false);
  });

  it.each([
    "host",
    "CONTENT-LENGTH",
    "Connection",
    "keep-alive",
    "TE",
    "trailer",
    "Transfer-Encoding",
    "upgrade",
    "Proxy-Authorization",
  ])("rejects forbidden header %s", (name) => {
    expect(parsesRequestHeaders([{ name, value: "configured" }])).toBe(false);
  });

  it.each(["Authorization", "Cookie", "User-Agent", "X-Custom-Header"])(
    "accepts allowed header %s",
    (name) => {
      expect(parsesRequestHeaders([{ name, value: "configured" }])).toBe(true);
    },
  );

  it.each(["Bad Header", "Header:", "Header@Name"])(
    "rejects invalid HTTP token name %s",
    (name) => {
      expect(parsesRequestHeaders([{ name, value: "configured" }])).toBe(false);
    },
  );

  it.each(["line\rbreak", "line\nbreak", "nul\0byte"])(
    "rejects control characters in values",
    (value) => {
      expect(parsesRequestHeaders([{ name: "X-Test", value }])).toBe(false);
    },
  );

  it("rejects empty names and values", () => {
    expect(parsesRequestHeaders([{ name: "", value: "configured" }])).toBe(false);
    expect(parsesRequestHeaders([{ name: "X-Test", value: "" }])).toBe(false);
  });

  it("accepts null as the edit-time preserve marker", () => {
    expect(parsesRequestHeaders([{ name: "Authorization", value: null }])).toBe(true);
  });

  it("requires HTTPS when headers are configured", () => {
    expect(
      createUptimeMonitorSchema.safeParse({ ...validMonitor, url: "http://example.com/health" })
        .success,
    ).toBe(false);
    expect(
      createUptimeMonitorSchema.safeParse({
        ...validMonitor,
        url: "http://example.com/health",
        requestHeaders: [],
      }).success,
    ).toBe(true);
  });
});
