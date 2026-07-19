import { describe, expect, it } from "vitest";

import { sanitizeErrorDetail } from "./error-detail.js";

describe("sanitizeErrorDetail", () => {
  it("includes status and provider body details", () => {
    const error = Object.assign(new Error("Request failed"), {
      status: 401,
      error: { type: "invalid_request_error", message: "Invalid API Key" },
    });

    expect(sanitizeErrorDetail(error)).toContain("status=401");
    expect(sanitizeErrorDetail(error)).toContain("Invalid API Key");
    expect(sanitizeErrorDetail(error)).toContain("invalid_request_error");
  });

  it("redacts secrets from error text", () => {
    const detail = sanitizeErrorDetail(
      new Error("Authorization Bearer gsk_live_secret_value failed"),
    );

    expect(detail).toContain("[redacted]");
    expect(detail).not.toContain("gsk_live_secret_value");
    expect(detail).not.toContain("Bearer gsk");
  });
});
