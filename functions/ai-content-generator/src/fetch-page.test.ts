import { describe, expect, it, vi } from "vitest";

import {
  FetchPageError,
  MAX_CONTEXT_TEXT_LENGTH,
  MAX_REDIRECTS,
  MAX_RESPONSE_BYTES,
  extractPageContext,
  fetchPageContext,
} from "./fetch-page.js";

const PUBLIC_ADDRESS = { address: "93.184.216.34", family: 4 as const };

function pageResponse({
  status = 200,
  headers = { "content-type": "text/html; charset=utf-8" },
  chunks = ["<html><body>Example</body></html>"],
}: {
  status?: number;
  headers?: Record<string, string>;
  chunks?: string[] | null;
} = {}) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  const cancel = vi.fn();

  return {
    status,
    getHeader: (name: string) => normalizedHeaders.get(name.toLowerCase()) ?? null,
    body:
      chunks === null
        ? null
        : (async function* () {
            for (const chunk of chunks) {
              yield Buffer.from(chunk);
            }
          })(),
    cancel,
  };
}

const resolvePublicHost = vi.fn(async () => [PUBLIC_ADDRESS]);

describe("fetchPageContext URL validation", () => {
  it.each([
    "file:///etc/passwd",
    "ftp://example.com/file",
    "http://localhost/admin",
    "http://service.localhost/admin",
    "http://printer.local/admin",
    "http://service.internal/admin",
    "http://router.home.arpa/admin",
    "http://127.0.0.1/admin",
    "http://10.20.30.40/admin",
    "http://169.254.169.254/latest/meta-data",
    "http://192.168.1.20/admin",
    "http://[::1]/admin",
    "http://[fc00::1]/admin",
  ])("rejects non-public URL %s", async (url) => {
    await expect(
      fetchPageContext(url, {
        resolveHost: resolvePublicHost,
        requestUrl: async () => pageResponse(),
      }),
    ).rejects.toMatchObject({ code: "URL_NOT_ALLOWED" });
  });

  it("rejects a hostname resolving to a private address", async () => {
    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [{ address: "172.16.4.2", family: 4 }],
        requestUrl: async () => pageResponse(),
      }),
    ).rejects.toMatchObject({ code: "URL_NOT_ALLOWED" });
  });

  it("uses a public address when DNS also returns a private address", async () => {
    const requestUrl = vi.fn(async () => pageResponse());
    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [
          PUBLIC_ADDRESS,
          { address: "10.0.0.2", family: 4 },
        ],
        requestUrl,
      }),
    ).resolves.toMatchObject({ finalUrl: "https://example.com/" });
    expect(requestUrl).toHaveBeenCalledWith(
      expect.any(URL),
      PUBLIC_ADDRESS,
      expect.any(AbortSignal),
    );
  });

  it("prefers IPv4 when both families are public", async () => {
    const requestUrl = vi.fn(async () => pageResponse());
    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [
          { address: "2606:4700:10::6814:179a", family: 6 },
          PUBLIC_ADDRESS,
        ],
        requestUrl,
      }),
    ).resolves.toMatchObject({ finalUrl: "https://example.com/" });
    expect(requestUrl).toHaveBeenCalledWith(
      expect.any(URL),
      PUBLIC_ADDRESS,
      expect.any(AbortSignal),
    );
  });

  it("pins the validated public address into the request", async () => {
    const requestUrl = vi.fn(async () => pageResponse());

    await fetchPageContext("https://example.com", {
      resolveHost: async () => [PUBLIC_ADDRESS],
      requestUrl,
    });

    expect(requestUrl).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: "example.com" }),
      PUBLIC_ADDRESS,
      expect.any(AbortSignal),
    );
  });
});

describe("fetchPageContext limits", () => {
  it("revalidates redirect destinations", async () => {
    const requestUrl = vi.fn(async () =>
      pageResponse({
        status: 302,
        headers: { location: "http://127.0.0.1/private" },
      }),
    );

    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [PUBLIC_ADDRESS],
        requestUrl,
      }),
    ).rejects.toMatchObject({ code: "URL_NOT_ALLOWED" });
    expect(requestUrl).toHaveBeenCalledTimes(1);
  });

  it("stops after the configured redirect limit", async () => {
    let requestCount = 0;
    const requestUrl = vi.fn(async () => {
      requestCount += 1;
      return pageResponse({
        status: 302,
        headers: { location: `/redirect-${requestCount}` },
      });
    });

    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [PUBLIC_ADDRESS],
        requestUrl,
      }),
    ).rejects.toMatchObject({ code: "FETCH_FAILED" });
    expect(requestUrl).toHaveBeenCalledTimes(MAX_REDIRECTS + 1);
  });

  it("rejects a declared response larger than the byte limit", async () => {
    const response = pageResponse({
      headers: {
        "content-type": "text/html",
        "content-length": String(MAX_RESPONSE_BYTES + 1),
      },
    });

    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [PUBLIC_ADDRESS],
        requestUrl: async () => response,
      }),
    ).rejects.toMatchObject({ code: "FETCH_FAILED" });
    expect(response.cancel).toHaveBeenCalledOnce();
  });

  it("stops streaming when the byte limit is exceeded", async () => {
    const response = pageResponse({ chunks: ["1234", "5678"] });

    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [PUBLIC_ADDRESS],
        requestUrl: async () => response,
        maxResponseBytes: 5,
      }),
    ).rejects.toMatchObject({ code: "FETCH_FAILED" });
    expect(response.cancel).toHaveBeenCalledOnce();
  });

  it("aborts requests after the configured timeout", async () => {
    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => [PUBLIC_ADDRESS],
        requestUrl: async (_url, _address, signal) =>
          await new Promise((_, reject) => {
            signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
          }),
        timeoutMs: 5,
      }),
    ).rejects.toMatchObject({ code: "FETCH_FAILED", message: "The page request timed out." });
  });

  it("applies the timeout while resolving DNS", async () => {
    await expect(
      fetchPageContext("https://example.com", {
        resolveHost: async () => await new Promise(() => undefined),
        requestUrl: async () => pageResponse(),
        timeoutMs: 5,
      }),
    ).rejects.toMatchObject({ code: "FETCH_FAILED", message: "The page request timed out." });
  });
});

describe("extractPageContext", () => {
  it("extracts bounded metadata and visible text", () => {
    const context = extractPageContext(
      `<!doctype html>
        <html>
          <head>
            <title> Example Docs </title>
            <meta name="description" content=" Useful reference material. ">
            <style>.hidden { display: none; }</style>
          </head>
          <body>
            <main>Public <strong>documentation</strong></main>
            <div hidden>Hidden text</div>
            <script>ignoreSecret()</script>
          </body>
        </html>`,
      "https://example.com/docs",
    );

    expect(context).toEqual({
      finalUrl: "https://example.com/docs",
      title: "Example Docs",
      description: "Useful reference material.",
      text: "Public documentation",
    });
  });

  it("limits extracted text length", () => {
    const context = extractPageContext(
      `<html><body>${"a".repeat(MAX_CONTEXT_TEXT_LENGTH + 100)}</body></html>`,
      "https://example.com/",
    );

    expect(context.text).toHaveLength(MAX_CONTEXT_TEXT_LENGTH);
  });

  it("rejects pages without usable context", () => {
    expect(() =>
      extractPageContext("<html><body><script>onlyScript()</script></body></html>", "https://example.com/"),
    ).toThrow(FetchPageError);
  });
});
