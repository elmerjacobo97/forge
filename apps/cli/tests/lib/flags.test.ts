import { describe, expect, it } from "vitest";
import { getFlagValue, getPositionals, hasFlag, parseListOptions, parseTagsFlag } from "../../src/flags.js";

describe("getFlagValue", () => {
  it("reads a value flag", () => {
    expect(getFlagValue(["--title", "Docs", "--url", "https://example.com"], "--title")).toBe(
      "Docs",
    );
  });

  it("returns undefined when the flag is missing or has no value", () => {
    expect(getFlagValue(["--title"], "--title")).toBeUndefined();
    expect(getFlagValue(["--json"], "--title")).toBeUndefined();
  });
});

describe("hasFlag / getPositionals", () => {
  it("detects --json without consuming the bookmark id", () => {
    const args = ["abc123", "--json", "--title", "Hi"];
    expect(hasFlag(args, "--json")).toBe(true);
    expect(getPositionals(args)).toEqual(["abc123"]);
  });

  it("skips valued flags when collecting positionals", () => {
    expect(getPositionals(["--title", "Docs", "row-id", "--tags", "a,b"])).toEqual(["row-id"]);
  });
});

describe("parseTagsFlag", () => {
  it("splits comma-separated tags and trims whitespace", () => {
    expect(parseTagsFlag(" react, hooks ,docs ")).toEqual(["react", "hooks", "docs"]);
  });

  it("returns an empty array for missing or blank input", () => {
    expect(parseTagsFlag(undefined)).toEqual([]);
    expect(parseTagsFlag("")).toEqual([]);
    expect(parseTagsFlag("   ")).toEqual([]);
  });
});

describe("parseListOptions", () => {
  it("returns empty options without flags", () => {
    expect(parseListOptions([])).toEqual({ options: {} });
  });

  it("parses limit and offset", () => {
    expect(parseListOptions(["--limit", "10", "--offset", "20"])).toEqual({
      options: { limit: 10, offset: 20 },
    });
  });

  it("parses a limit without offset", () => {
    expect(parseListOptions(["--limit", "10"])).toEqual({
      options: { limit: 10 },
    });
  });

  it("rejects invalid limits", () => {
    for (const value of ["0", "1001", "abc", "10.5"]) {
      expect(parseListOptions(["--limit", value])).toEqual({
        error: expect.stringContaining("--limit"),
      });
    }
  });

  it("rejects invalid offsets", () => {
    expect(parseListOptions(["--limit", "10", "--offset", "-1"])).toEqual({
      error: expect.stringContaining("--offset"),
    });
    expect(parseListOptions(["--limit", "10", "--offset", "abc"])).toEqual({
      error: expect.stringContaining("--offset"),
    });
  });

  it("requires --limit when --offset is present", () => {
    expect(parseListOptions(["--offset", "5"])).toEqual({
      error: expect.stringContaining("--offset requires --limit"),
    });
  });

  it("rejects flags without a value", () => {
    expect(parseListOptions(["--limit"])).toEqual({
      error: expect.stringContaining("--limit"),
    });
    expect(parseListOptions(["--limit", "10", "--offset"])).toEqual({
      error: expect.stringContaining("--offset"),
    });
  });
});
