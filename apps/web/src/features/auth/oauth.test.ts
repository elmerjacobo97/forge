import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./oauth";

describe("safeRedirectPath", () => {
  it("keeps local paths and falls back for external or malformed paths", () => {
    expect(safeRedirectPath("/tickets?filter=open#top")).toBe("/tickets?filter=open#top");
    expect(safeRedirectPath(undefined)).toBe("/dev-board");
    expect(safeRedirectPath("https://evil.example")).toBe("/dev-board");
    expect(safeRedirectPath("//evil.example")).toBe("/dev-board");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dev-board");
  });
});
