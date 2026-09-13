import { describe, expect, it } from "vitest";
import { parseIdeaCreateInput, parseIdeaUpdateInput } from "../../src/idea-schema.js";

describe("parseIdeaCreateInput", () => {
  it("applies seed and other defaults", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "An app that joins strangers for coffee.",
    });

    expect(result).toEqual({
      title: "Coffee meetup app",
      content: "An app that joins strangers for coffee.",
      status: "seed",
      category: "other",
      tags: [],
      links: [],
    });
  });

  it("accepts a full payload", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "An app that joins strangers for coffee.",
      status: "exploring",
      category: "mobile",
      tags: ["social", "local"],
      links: ["https://example.com/inspiration"],
    });

    expect(result).toEqual({
      title: "Coffee meetup app",
      content: "An app that joins strangers for coffee.",
      status: "exploring",
      category: "mobile",
      tags: ["social", "local"],
      links: ["https://example.com/inspiration"],
    });
  });

  it("normalizes tags with trim, lowercase, and dedupe", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "content",
      tags: [" Social ", "social", "LOCAL", ""],
    });

    expect(result).toHaveProperty("tags", ["social", "local"]);
  });

  it("dedupes links and trims whitespace", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "content",
      links: [" https://example.com/a ", "https://example.com/a"],
    });

    expect(result).toHaveProperty("links", ["https://example.com/a"]);
  });

  it("rejects a short title and empty content", () => {
    const result = parseIdeaCreateInput({ title: "A", content: "" });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Title must be at least 2 characters.");
    expect(result.error).toContain("Content is required.");
  });

  it("rejects invalid status and category with the value list", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "content",
      status: "bogus",
      category: "bogus",
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("seed, exploring, building, parked, shipped");
    expect(result.error).toContain("app, web, mobile, business, other");
  });

  it("rejects non-URL links", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "content",
      links: ["not-a-url"],
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Links must be valid URLs.");
  });

  it("rejects more than 10 links", () => {
    const result = parseIdeaCreateInput({
      title: "Coffee meetup app",
      content: "content",
      links: [
        "https://e1.com",
        "https://e2.com",
        "https://e3.com",
        "https://e4.com",
        "https://e5.com",
        "https://e6.com",
        "https://e7.com",
        "https://e8.com",
        "https://e9.com",
        "https://e10.com",
        "https://e11.com",
      ],
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Links must be at most 10.");
  });
});

describe("parseIdeaUpdateInput", () => {
  it("accepts a partial update", () => {
    const result = parseIdeaUpdateInput({ status: "building" });

    expect(result).toEqual({ status: "building" });
  });

  it("does not apply defaults on updates", () => {
    const result = parseIdeaUpdateInput({ title: "New title" });

    expect(result).toEqual({ title: "New title" });
  });

  it("rejects an empty update", () => {
    const result = parseIdeaUpdateInput({});

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Provide at least one field to update.");
  });

  it("normalizes tags and links on updates", () => {
    const result = parseIdeaUpdateInput({
      tags: ["IDEA", "idea"],
      links: ["https://example.com/b"],
    });

    expect(result).toEqual({ tags: ["idea"], links: ["https://example.com/b"] });
  });
});
