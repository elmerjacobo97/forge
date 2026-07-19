import { lookup } from "node:dns/promises";
import { request as requestHttp } from "node:http";
import { request as requestHttps } from "node:https";
import { BlockList, isIP } from "node:net";

import * as cheerio from "cheerio";

import { sanitizeErrorDetail } from "./error-detail.js";

export const FETCH_TIMEOUT_MS = 5_000;
export const MAX_REDIRECTS = 3;
export const MAX_RESPONSE_BYTES = 1_000_000;
export const MAX_CONTEXT_TEXT_LENGTH = 20_000;

export interface FetchedPageContext {
  finalUrl: string;
  title: string | null;
  description: string | null;
  text: string;
}

type FetchPageErrorCode = "URL_NOT_ALLOWED" | "FETCH_FAILED";

export class FetchPageError extends Error {
  constructor(
    readonly code: FetchPageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FetchPageError";
  }
}

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

interface PageResponse {
  status: number;
  getHeader(name: string): string | null;
  body: AsyncIterable<Uint8Array> | null;
  cancel(): void;
}

type ResolveHost = (hostname: string) => Promise<readonly ResolvedAddress[]>;
type RequestUrl = (
  url: URL,
  address: ResolvedAddress,
  signal: AbortSignal,
) => Promise<PageResponse>;

interface FetchPageOptions {
  resolveHost?: ResolveHost;
  requestUrl?: RequestUrl;
  timeoutMs?: number;
  maxRedirects?: number;
  maxResponseBytes?: number;
  maxContextTextLength?: number;
}

const blockedAddresses = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

async function defaultResolveHost(hostname: string): Promise<readonly ResolvedAddress[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map(({ address, family }) => ({
    address,
    family: family === 6 ? 6 : 4,
  }));
}

function defaultRequestUrl(
  url: URL,
  address: ResolvedAddress,
  signal: AbortSignal,
): Promise<PageResponse> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? requestHttps : requestHttp;
    const request = transport(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "Forge AI Content Generator/1.0",
          host: url.host,
        },
        signal,
        servername: url.hostname,
        family: address.family,
        lookup: (_hostname, _options, callback) => {
          callback(null, address.address, address.family);
        },
      },
      (response) => {
        resolve({
          status: response.statusCode ?? 0,
          getHeader(name) {
            const value = response.headers[name.toLowerCase()];
            return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
          },
          body: response,
          cancel() {
            response.destroy();
          },
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function isBlockedAddress(address: ResolvedAddress): boolean {
  return blockedAddresses.check(address.address, address.family === 4 ? "ipv4" : "ipv6");
}

function withAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new Error("aborted"));
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => reject(new Error("aborted"));
    signal.addEventListener("abort", handleAbort, { once: true });

    operation.then(
      (value) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", handleAbort);
        reject(error);
      },
    );
  });
}

async function resolvePublicAddress(
  url: URL,
  resolveHost: ResolveHost,
  signal: AbortSignal,
): Promise<ResolvedAddress> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchPageError("URL_NOT_ALLOWED", "Only HTTP(S) URLs are allowed.");
  }

  if (url.username || url.password) {
    throw new FetchPageError("URL_NOT_ALLOWED", "URLs with credentials are not allowed.");
  }

  const hostname = normalizeHostname(url.hostname);
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home.arpa")
  ) {
    throw new FetchPageError("URL_NOT_ALLOWED", "Local hosts are not allowed.");
  }

  const ipFamily = isIP(hostname);
  let addresses: readonly ResolvedAddress[];

  try {
    addresses = ipFamily
      ? [{ address: hostname, family: ipFamily === 6 ? 6 : 4 }]
      : await withAbort(resolveHost(hostname), signal);
  } catch {
    throw new FetchPageError("FETCH_FAILED", "The page host could not be resolved.");
  }

  if (addresses.length === 0) {
    throw new FetchPageError("FETCH_FAILED", "The page host could not be resolved.");
  }

  const publicAddresses = addresses.filter((address) => !isBlockedAddress(address));
  if (publicAddresses.length === 0) {
    throw new FetchPageError("URL_NOT_ALLOWED", "Private or reserved networks are not allowed.");
  }

  return publicAddresses.find((address) => address.family === 4) ?? publicAddresses[0];
}

async function readLimitedBody(
  response: PageResponse,
  maxResponseBytes: number,
): Promise<string> {
  const contentLength = Number(response.getHeader("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxResponseBytes) {
    response.cancel();
    throw new FetchPageError("FETCH_FAILED", "The page response is too large.");
  }

  if (!response.body) {
    throw new FetchPageError("FETCH_FAILED", "The page returned no content.");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of response.body) {
    totalBytes += chunk.byteLength;
    if (totalBytes > maxResponseBytes) {
      response.cancel();
      throw new FetchPageError("FETCH_FAILED", "The page response is too large.");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks, totalBytes).toString("utf8");
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function extractPageContext(
  html: string,
  finalUrl: string,
  maxTextLength = MAX_CONTEXT_TEXT_LENGTH,
): FetchedPageContext {
  const $ = cheerio.load(html);
  const title = normalizeText($("title").first().text()) || null;
  const description =
    normalizeText(
      $('meta[name="description" i]').attr("content") ??
        $('meta[property="og:description" i]').attr("content") ??
        "",
    ) || null;

  $("script, style, template, noscript, svg, canvas").remove();
  $("[hidden], [aria-hidden='true']").remove();

  const bodyText = $("body").prop("innerText") ?? $("body").text();
  const text = normalizeText(bodyText).slice(0, maxTextLength);

  if (!title && !description && !text) {
    throw new FetchPageError("FETCH_FAILED", "The page contains no usable content.");
  }

  return { finalUrl, title, description, text };
}

export async function fetchPageContext(
  input: string,
  options: FetchPageOptions = {},
): Promise<FetchedPageContext> {
  const resolveHost = options.resolveHost ?? defaultResolveHost;
  const requestUrl = options.requestUrl ?? defaultRequestUrl;
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const maxResponseBytes = options.maxResponseBytes ?? MAX_RESPONSE_BYTES;
  const maxContextTextLength = options.maxContextTextLength ?? MAX_CONTEXT_TEXT_LENGTH;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let currentUrl: URL;
    try {
      currentUrl = new URL(input);
    } catch {
      throw new FetchPageError("URL_NOT_ALLOWED", "The URL is invalid.");
    }

    for (let redirectCount = 0; ; redirectCount += 1) {
      const address = await resolvePublicAddress(currentUrl, resolveHost, controller.signal);
      const response = await requestUrl(currentUrl, address, controller.signal);

      if (response.status >= 300 && response.status < 400) {
        response.cancel();
        const location = response.getHeader("location");
        if (!location || redirectCount >= maxRedirects) {
          throw new FetchPageError("FETCH_FAILED", "The page exceeded the redirect limit.");
        }
        currentUrl = new URL(location, currentUrl);
        continue;
      }

      if (response.status < 200 || response.status >= 300) {
        response.cancel();
        throw new FetchPageError("FETCH_FAILED", "The page returned an unsuccessful response.");
      }

      const contentType = response.getHeader("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        response.cancel();
        throw new FetchPageError("FETCH_FAILED", "The URL did not return HTML content.");
      }

      const html = await readLimitedBody(response, maxResponseBytes);
      return extractPageContext(html, currentUrl.href, maxContextTextLength);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new FetchPageError("FETCH_FAILED", "The page request timed out.");
    }
    if (error instanceof FetchPageError) {
      throw error;
    }
    throw new FetchPageError(
      "FETCH_FAILED",
      `The page could not be fetched: ${sanitizeErrorDetail(error)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
