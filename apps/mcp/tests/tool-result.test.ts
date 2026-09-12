import { describe, expect, it } from "vitest";
import { toToolError, toToolResult } from "../src/tool-result.js";

describe("toToolResult", () => {
  it("serializes the value as compact JSON text", () => {
    expect(toToolResult({ id: "p1", nested: [1, 2] })).toEqual({
      content: [{ type: "text", text: '{"id":"p1","nested":[1,2]}' }],
    });
  });
});

describe("toToolError", () => {
  it("marks Error messages as isError", () => {
    expect(toToolError(new Error("Project not found."))).toEqual({
      content: [{ type: "text", text: "Project not found." }],
      isError: true,
    });
  });

  it("stringifies non-Error values", () => {
    expect(toToolError("boom").content[0]?.text).toBe("boom");
  });
});
