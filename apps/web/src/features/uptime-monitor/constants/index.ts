/** Allowed check intervals, in minutes. */
export const UPTIME_INTERVALS_MINUTES = [1, 5, 15, 30] as const;

/** Default check interval for new monitors. */
export const UPTIME_DEFAULT_INTERVAL_MINUTES = 5;

/** Default expected HTTP status for new monitors. */
export const UPTIME_DEFAULT_EXPECTED_STATUS = 200;

/** Default consecutive-failure threshold for new monitors. */
export const UPTIME_DEFAULT_FAILURE_THRESHOLD = 2;

/** Min/max consecutive-failure threshold. */
export const UPTIME_FAILURE_THRESHOLD_MIN = 1;
export const UPTIME_FAILURE_THRESHOLD_MAX = 10;

/** Per-check fetch timeout. */
export const UPTIME_CHECK_TIMEOUT_MS = 10_000;

/** Max monitors per authenticated user. */
export const UPTIME_MAX_MONITORS_PER_USER = 10;

/** Checks older than this are deleted on every cron run. */
export const UPTIME_CHECK_RETENTION_DAYS = 30;

/** Monitor name length bounds. */
export const UPTIME_NAME_MAX_LENGTH = 80;

/** Monitor URL length bounds. */
export const UPTIME_URL_MAX_LENGTH = 2048;

/** Per-monitor custom request header limits. */
export const UPTIME_REQUEST_HEADERS_MAX = 20;
export const UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH = 100;
export const UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH = 2000;

/** Headers managed by the HTTP runtime rather than individual monitors. */
export const UPTIME_REQUEST_HEADER_DENYLIST = [
  "host",
  "content-length",
  "connection",
  "keep-alive",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
] as const;

/** Max same-origin redirects followed when custom headers are configured. */
export const UPTIME_REQUEST_HEADERS_MAX_REDIRECTS = 5;

/** UI detail-view poll interval when the tab is visible. */
export const UPTIME_POLL_INTERVAL_MS = 30_000;

/** Window used to compute the uptime % shown in the monitor list. */
export const UPTIME_UPTIME_WINDOW_HOURS = 24;

/** Max checks fetched for the monitor detail history view. */
export const UPTIME_CHECK_HISTORY_LIMIT = 200;

export const UPTIME_STATUS_LABELS = {
  pending: "Pending",
  up: "Up",
  down: "Down",
} as const;

export const UPTIME_STATUS_DOT_COLORS = {
  pending: "bg-amber-500",
  up: "bg-emerald-500",
  down: "bg-rose-500",
} as const;
