import type { WebhookEvent } from "../types";

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

const SKIP_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
]);

/** Build a pasteable cURL command from a captured webhook event. */
export function eventToCurl(event: WebhookEvent, origin: string): string {
  const base = origin.replace(/\/$/, "");
  const url = event.path.startsWith("http")
    ? event.path
    : `${base}${event.path.startsWith("/") ? "" : "/"}${event.path}`;

  const lines = [`curl -X ${shellSingleQuote(event.method)}`];

  for (const [key, value] of Object.entries(event.headers)) {
    if (SKIP_HEADERS.has(key.toLowerCase())) continue;
    lines.push(`  -H ${shellSingleQuote(`${key}: ${value}`)}`);
  }

  const method = event.method.toUpperCase();
  if (event.body && method !== "GET" && method !== "HEAD") {
    lines.push(`  --data-binary ${shellSingleQuote(event.body)}`);
  }

  lines.push(`  ${shellSingleQuote(url)}`);
  return lines.join(" \\\n");
}
