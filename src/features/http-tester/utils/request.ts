import { fetch } from "@tauri-apps/plugin-http";

import type { HttpRequestConfig, HttpResponseData, KeyValue } from "./history";

function buildUrl(url: string, params: KeyValue[]): string {
  const enabledParams = params.filter((p) => p.enabled && p.key.trim());
  if (enabledParams.length === 0) return url;

  const separator = url.includes("?") ? "&" : "?";
  const queryString = enabledParams
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");
  return `${url}${separator}${queryString}`;
}

function buildHeaders(headers: KeyValue[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers) {
    if (h.enabled && h.key.trim()) {
      result[h.key.trim()] = h.value;
    }
  }
  return result;
}

function buildBody(config: HttpRequestConfig): string | FormData | null {
  if (config.bodyType === "none" || !config.body.trim()) return null;

  if (config.bodyType === "form") {
    const formData = new FormData();
    try {
      const pairs = JSON.parse(config.body);
      if (Array.isArray(pairs)) {
        for (const pair of pairs) {
          if (pair.key && pair.enabled !== false) {
            formData.append(pair.key, pair.value ?? "");
          }
        }
      }
    } catch {
      return null;
    }
    return formData;
  }

  return config.body;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function tryPrettyJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export async function executeRequest(
  config: HttpRequestConfig,
): Promise<
  | { response: HttpResponseData; error: null }
  | { response: null; error: string }
> {
  const trimmedUrl = config.url.trim();
  if (!trimmedUrl) {
    return { response: null, error: "URL is required" };
  }

  let finalUrl: string;
  try {
    finalUrl = buildUrl(trimmedUrl, config.params);
  } catch {
    return { response: null, error: "Invalid URL" };
  }

  const headers = buildHeaders(config.headers);
  const body = buildBody(config);

  const init: Parameters<typeof fetch>[1] = {
    method: config.method,
    headers,
    connectTimeout: 30000,
  };

  if (body !== null && config.method !== "GET" && config.method !== "HEAD") {
    init.body = body;
  }

  const startTime = performance.now();

  try {
    const res = await fetch(finalUrl, init);
    const durationMs = Math.round(performance.now() - startTime);
    const text = await res.text();
    const size = new Blob([text]).size;

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = res.headers.get("content-type") ?? "";
    const formattedBody = contentType.includes("json")
      ? tryPrettyJson(text)
      : text;

    return {
      response: {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: formattedBody,
        size,
        durationMs,
        contentType,
      },
      error: null,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = err instanceof Error ? err.message : String(err);
    return {
      response: null,
      error: `Request failed (${durationMs}ms): ${message}`,
    };
  }
}

export { formatSize };
