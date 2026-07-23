import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateSession = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@insforge/sdk/ssr/middleware", () => ({ updateSession }));

import { proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    updateSession.mockClear();
  });

  it("redirects unauthenticated requests for protected routes", async () => {
    const response = await proxy(new NextRequest("http://localhost/dev-board/project-1"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?redirect=%2Fdev-board%2Fproject-1",
    );
    expect(updateSession).not.toHaveBeenCalled();
  });

  it.each(["/robots.txt", "/sitemap.xml", "/opengraph-image", "/missing-page"])(
    "allows public and unknown paths: %s",
    async (pathname) => {
      const response = await proxy(new NextRequest(`http://localhost${pathname}`));

      expect(response.headers.get("location")).toBeNull();
      expect(updateSession).toHaveBeenCalledOnce();
    },
  );
});
