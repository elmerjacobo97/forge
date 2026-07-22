import type { HttpMethod, HttpRequestConfig } from "./utils/history";

export const METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-amber-600 dark:text-amber-400",
  PUT: "text-blue-600 dark:text-blue-400",
  PATCH: "text-violet-600 dark:text-violet-400",
  DELETE: "text-destructive",
  HEAD: "text-muted-foreground",
  OPTIONS: "text-muted-foreground",
};

export const DEFAULT_CONFIG: HttpRequestConfig = {
  method: "GET",
  url: "",
  params: [],
  headers: [],
  bodyType: "none",
  body: "",
};

export function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return "text-emerald-600 dark:text-emerald-400";
  if (status >= 300 && status < 400) return "text-blue-600 dark:text-blue-400";
  if (status >= 400 && status < 500)
    return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}
