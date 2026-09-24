import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateSession = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@insforge/sdk/ssr/middleware", () => ({ updateSession }));

import { proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    updateSession.mockReset();
    updateSession.mockResolvedValue(undefined);
  });

  it("redirects unauthenticated requests for protected routes", async () => {
    const response = await proxy(new NextRequest("http://localhost/dev-board/project-1"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?redirect=%2Fdev-board%2Fproject-1",
    );
    expect(updateSession).not.toHaveBeenCalled();
  });

  it.each(["/resources", "/bookmarks", "/uptime-monitor", "/webhook-inspector"])(
    "protects retained routes: %s",
    async (pathname) => {
      const response = await proxy(new NextRequest(`http://localhost${pathname}`));

      expect(response.headers.get("location")).toBe(
        `http://localhost/login?redirect=${encodeURIComponent(pathname)}`,
      );
      expect(updateSession).not.toHaveBeenCalled();
    },
  );

  it.each(["/robots.txt", "/sitemap.xml", "/opengraph-image", "/missing-page"])(
    "allows public and unknown paths: %s",
    async (pathname) => {
      const response = await proxy(new NextRequest(`http://localhost${pathname}`));

      expect(response.headers.get("location")).toBeNull();
      expect(updateSession).toHaveBeenCalledOnce();
    },
  );

  it("forwards refreshed request cookies to the current request", async () => {
    updateSession.mockImplementationOnce(async ({ requestCookies, responseCookies }) => {
      requestCookies.set("insforge_access_token", "fresh-token", { path: "/" });
      responseCookies.set("insforge_access_token", "fresh-token", { path: "/" });
    });

    const request = new NextRequest("http://localhost/dev-board", {
      headers: { cookie: "insforge_refresh_token=refresh-token" },
    });
    const response = await proxy(request);

    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "insforge_access_token=fresh-token",
    );
    expect(response.headers.getSetCookie()).toEqual(
      expect.arrayContaining([expect.stringContaining("insforge_access_token=fresh-token")]),
    );
  });

  it("replays cleared session cookies on the response", async () => {
    updateSession.mockImplementationOnce(async ({ responseCookies }) => {
      responseCookies.set("insforge_access_token", "", { maxAge: 0, path: "/" });
    });

    const request = new NextRequest("http://localhost/dev-board", {
      headers: { cookie: "insforge_refresh_token=refresh-token" },
    });
    const response = await proxy(request);

    expect(response.headers.getSetCookie()).toEqual(
      expect.arrayContaining([expect.stringMatching(/insforge_access_token=.*Max-Age=0/)]),
    );
  });
});
