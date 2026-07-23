import { describe, expect, it } from "vitest";

import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO metadata routes", () => {
  it("publishes only the public landing page in the sitemap", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe("https://forge.elmerjacobo.dev/");
    expect(entries[0].priority).toBe(1);
  });

  it("allows public pages, blocks API crawling, and advertises the sitemap", () => {
    const value = robots();

    expect(value.rules).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(value.sitemap).toBe("https://forge.elmerjacobo.dev/sitemap.xml");
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
