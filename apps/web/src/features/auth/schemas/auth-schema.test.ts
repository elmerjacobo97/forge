import { describe, expect, it } from "vitest";

import { verifyEmailSchema } from "./auth-schema";

describe("verifyEmailSchema", () => {
  it("accepts a six-digit verification code", () => {
    expect(
      verifyEmailSchema.safeParse({ email: "user@example.com", otp: "122428" }).success,
    ).toBe(true);
  });

  it.each(["12345", "1234567", "12a456"])("rejects invalid code %s", (otp) => {
    expect(verifyEmailSchema.safeParse({ email: "user@example.com", otp }).success).toBe(false);
  });
});
