import { describe, expect, it } from "vitest";

import { linksFromString } from "./idea-form";

describe("linksFromString", () => {
  it("splits on commas and newlines", () => {
    expect(linksFromString("https://a.com, https://b.com\nhttps://c.com")).toEqual([
      "https://a.com",
      "https://b.com",
      "https://c.com",
    ]);
  });

  it("trims entries and drops empty values", () => {
    expect(linksFromString("  https://a.com  ,, \n ")).toEqual(["https://a.com"]);
  });

  it("dedupes repeated URLs", () => {
    expect(linksFromString("https://a.com\nhttps://a.com")).toEqual(["https://a.com"]);
  });

  it("returns an empty array for empty input", () => {
    expect(linksFromString("")).toEqual([]);
  });
});
