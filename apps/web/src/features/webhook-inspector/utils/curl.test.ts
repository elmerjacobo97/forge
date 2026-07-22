import { describe, expect, it } from "vitest";

import type { WebhookEvent } from "../types";
import { eventToCurl } from "./curl";

const event: WebhookEvent = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  endpointId: "550e8400-e29b-41d4-a716-446655440001",
  method: "POST",
  path: "/api/hooks/abc?x=1",
  headers: {
    "content-type": "application/json",
    host: "forge.example",
    "user-agent": "curl/8",
  },
  body: `{"a":1,"note":"it's fine"}`,
  bodyTruncated: false,
  sourceIp: "1.2.3.4",
  userAgent: "curl/8",
  receivedAt: "2026-07-20T01:00:00.000Z",
};

describe("eventToCurl", () => {
  it("builds a usable curl with method, headers, body, and URL", () => {
    const command = eventToCurl(event, "https://forge.example");
    expect(command).toContain("curl -X 'POST'");
    expect(command).toContain("-H 'content-type: application/json'");
    expect(command).toContain("-H 'user-agent: curl/8'");
    expect(command).not.toContain("-H 'host:");
    expect(command).toContain(`--data-binary '{"a":1,"note":"it'\\''s fine"}'`);
    expect(command).toContain("'https://forge.example/api/hooks/abc?x=1'");
  });

  it("omits body for GET", () => {
    const command = eventToCurl(
      { ...event, method: "GET", body: "ignored" },
      "https://forge.example",
    );
    expect(command).not.toContain("--data-binary");
  });
});
