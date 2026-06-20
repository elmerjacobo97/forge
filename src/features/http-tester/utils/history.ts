export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface KeyValue {
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

const STORAGE_KEY = "forge-http-history";
const MAX_HISTORY = 50;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
