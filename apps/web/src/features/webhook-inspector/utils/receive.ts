import { WEBHOOK_BODY_MAX_CHARS } from "../constants";

export function truncateWebhookBody(raw: string): {
  body: string;
  bodyTruncated: boolean;
} {
  if (raw.length <= WEBHOOK_BODY_MAX_CHARS) {
    return { body: raw, bodyTruncated: false };
  }
  return {
    body: raw.slice(0, WEBHOOK_BODY_MAX_CHARS),
    bodyTruncated: true,
  };
}

export function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function requestPathWithQuery(url: URL): string {
  return `${url.pathname}${url.search}`;
}

export function sourceIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const realIp = headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, 128) : null;
}

/** Truncate an instant to the start of its UTC minute. */
export function rateLimitWindowStart(now: Date = new Date()): string {
  const truncated = new Date(now);
  truncated.setUTCSeconds(0, 0);
  return truncated.toISOString();
}
