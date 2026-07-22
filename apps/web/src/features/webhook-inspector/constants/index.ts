/** TTL for new endpoints: created_at + 7 days. */
export const WEBHOOK_ENDPOINT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Max non-expired endpoints per authenticated user. */
export const WEBHOOK_MAX_ENDPOINTS_PER_USER = 5;

/** Captured body text is truncated to this many characters. */
export const WEBHOOK_BODY_MAX_CHARS = 64_000;

/** Max stored events per endpoint; further requests are rejected. */
export const WEBHOOK_MAX_EVENTS_PER_ENDPOINT = 100;

/** Max accepted requests per token per UTC minute window. */
export const WEBHOOK_RATE_LIMIT_PER_MINUTE = 60;

/** UI event-feed poll interval when the tab is visible. */
export const WEBHOOK_POLL_INTERVAL_MS = 2_000;

/** Opaque token length (hex of 32 random bytes). */
export const WEBHOOK_TOKEN_BYTES = 32;
