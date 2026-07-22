export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyType = "none" | "json" | "text" | "form";

export interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  body: string;
}

export interface HttpResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  durationMs: number;
  contentType: string;
}

export interface HistoryEntry {
  id: string;
  request: HttpRequestConfig;
  response: Pick<HttpResponseData, "status" | "durationMs" | "size">;
  timestamp: number;
}

const STORAGE_KEY = "forge-http-history:v1";
const MAX_HISTORY = 50;

function newPairId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKeyValue(value: unknown): KeyValue | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.key !== "string" || typeof record.value !== "string") return null;
  return {
    id: typeof record.id === "string" ? record.id : newPairId(),
    key: record.key,
    value: record.value,
    enabled: record.enabled !== false,
  };
}

function normalizeRequest(value: unknown): HttpRequestConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.method !== "string" || typeof record.url !== "string") return null;
  const params = Array.isArray(record.params)
    ? record.params.map(normalizeKeyValue).filter((p): p is KeyValue => p !== null)
    : [];
  const headers = Array.isArray(record.headers)
    ? record.headers.map(normalizeKeyValue).filter((p): p is KeyValue => p !== null)
    : [];
  return {
    method: record.method as HttpRequestConfig["method"],
    url: record.url,
    params,
    headers,
    bodyType: (typeof record.bodyType === "string" ? record.bodyType : "none") as HttpRequestConfig["bodyType"],
    body: typeof record.body === "string" ? record.body : "",
  };
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const request = normalizeRequest(record.request);
      if (!request || typeof record.id !== "string") return [];
      const response = record.response;
      if (typeof response !== "object" || response === null) return [];
      const res = response as Record<string, unknown>;
      if (
        typeof res.status !== "number" ||
        typeof res.durationMs !== "number" ||
        typeof res.size !== "number"
      ) {
        return [];
      }
      return [
        {
          id: record.id,
          request,
          response: {
            status: res.status,
            durationMs: res.durationMs,
            size: res.size,
          },
          timestamp: typeof record.timestamp === "number" ? record.timestamp : Date.now(),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryEntry[]): void {
  try {
    const trimmed = history.slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function addHistoryEntry(
  history: HistoryEntry[],
  request: HttpRequestConfig,
  response: Pick<HttpResponseData, "status" | "durationMs" | "size">,
): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    request,
    response,
    timestamp: Date.now(),
  };
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  saveHistory(updated);
  return updated;
}

export function removeHistoryEntry(
  history: HistoryEntry[],
  id: string,
): HistoryEntry[] {
  const updated = history.filter((h) => h.id !== id);
  saveHistory(updated);
  return updated;
}
