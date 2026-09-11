import { describe, expect, it } from "vitest";

import manifest from "./manifest";
import robots from "./robots";

describe("SEO metadata routes", () => {
  it("keeps the private app out of search indexes", () => {
    const value = robots();

    expect(value.rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("exposes install metadata and the SVG application icon", () => {
    const value = manifest();

    expect(value.start_url).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.icons).toContainEqual({
      src: "/favicon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    });
  });
});
