import { describe, expect, it } from "vitest";

import { MAX_VISIBLE, MIN_VISIBLE, PAGE_SIZE, parseVisibleParam } from "./pagination";

describe("parseVisibleParam", () => {
  it("falls back to the page size when visible is absent", () => {
    expect(parseVisibleParam(undefined)).toBe(PAGE_SIZE);
    expect(parseVisibleParam([])).toBe(PAGE_SIZE);
  });

  it("falls back to the page size when visible is not numeric", () => {
    expect(parseVisibleParam("abc")).toBe(PAGE_SIZE);
    expect(parseVisibleParam("")).toBe(PAGE_SIZE);
  });

  it("falls back to the page size when visible is not an integer", () => {
    expect(parseVisibleParam("10.5")).toBe(PAGE_SIZE);
    expect(parseVisibleParam("abc20")).toBe(PAGE_SIZE);
  });

  it("falls back to the page size when visible is below the minimum", () => {
    expect(parseVisibleParam("0")).toBe(PAGE_SIZE);
    expect(parseVisibleParam("5")).toBe(PAGE_SIZE);
    expect(parseVisibleParam("-20")).toBe(PAGE_SIZE);
    expect(parseVisibleParam(String(MIN_VISIBLE - 1))).toBe(PAGE_SIZE);
  });

  it("keeps valid values within range", () => {
    expect(parseVisibleParam(String(MIN_VISIBLE))).toBe(MIN_VISIBLE);
    expect(parseVisibleParam("20")).toBe(20);
    expect(parseVisibleParam("15")).toBe(15);
    expect(parseVisibleParam(String(MAX_VISIBLE))).toBe(MAX_VISIBLE);
  });

  it("clamps values above the maximum", () => {
    expect(parseVisibleParam("999")).toBe(MAX_VISIBLE);
    expect(parseVisibleParam(String(MAX_VISIBLE + 1))).toBe(MAX_VISIBLE);
  });

  it("uses the first value when the param repeats", () => {
    expect(parseVisibleParam(["20", "30"])).toBe(20);
  });
});
