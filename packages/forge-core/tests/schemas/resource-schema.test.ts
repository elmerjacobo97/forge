import { describe, expect, it } from "vitest";
import { parseResourceCreateInput, parseResourceUpdateInput } from "../../src/resource-schema.js";

describe("parseResourceCreateInput", () => {
  it("accepts a valid programmer link", () => {
    expect(
      parseResourceCreateInput({
        title: "React docs",
        url: "https://react.dev",
        category: "docs",
        description: "Official React documentation",
        tags: ["react", "docs"],
      }),
    ).toEqual({
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      tags: ["react", "docs"],
    });
  });

  it("rejects invalid fields", () => {
    const result = parseResourceCreateInput({
      title: "x",
      url: "not-a-url",
      category: "nope",
      description: "hi",
      tags: [],
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Title must be at least 2 characters.");
    expect(result.error).toContain("Must be a valid URL.");
    expect(result.error).toContain("Category must be one of:");
    expect(result.error).toContain("Description must be at least 5 characters.");
  });

  it("requires create fields", () => {
    const result = parseResourceCreateInput({ tags: [] });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Title is required (--title).");
    expect(result.error).toContain("URL is required (--url).");
    expect(result.error).toContain("Description is required (--description).");
  });
});

describe("parseResourceUpdateInput", () => {
  it("accepts a partial update", () => {
    expect(parseResourceUpdateInput({ title: "Updated title" })).toEqual({
      title: "Updated title",
    });
  });

  it("rejects empty or invalid updates", () => {
    expect(parseResourceUpdateInput({})).toHaveProperty("error");

    const result = parseResourceUpdateInput({ url: "bad" });
    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Must be a valid URL.");
  });
});
