import { describe, expect, it } from "vitest";

import { loginSchema } from "./auth-schema";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "12345678" }).success).toBe(
      true,
    );
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "12345678" }).success).toBe(
      false,
    );
  });

  it("rejects a short password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "short" }).success).toBe(
      false,
    );
  });
});
