import { describe, expect, it } from "vitest";

import { mapHref, parseMapParams } from "./map-params";

describe("parseMapParams", () => {
  it("reads module and flow slugs", () => {
    expect(parseMapParams({ module: "dev-board", flow: "create-project" })).toEqual({
      moduleSlug: "dev-board",
      flowSlug: "create-project",
    });
  });

  it("uses the first value of a repeated param", () => {
    expect(parseMapParams({ module: ["a", "b"] }).moduleSlug).toBe("a");
  });

  it("drops missing and malformed slugs", () => {
    expect(parseMapParams({})).toEqual({ moduleSlug: null, flowSlug: null });
    expect(parseMapParams({ module: "Dev Board", flow: "x".repeat(61) })).toEqual({
      moduleSlug: null,
      flowSlug: null,
    });
  });
});

describe("mapHref", () => {
  it("builds the flows url with the zoom level in the query", () => {
    expect(mapHref("p-1")).toBe("/dev-board/p-1/flows");
    expect(mapHref("p-1", { moduleSlug: "auth", flowSlug: "login" })).toBe(
      "/dev-board/p-1/flows?module=auth&flow=login",
    );
  });
});
