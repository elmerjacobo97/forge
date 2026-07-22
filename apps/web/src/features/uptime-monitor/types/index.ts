export type MonitorMethod = "GET" | "HEAD";
export type MonitorStatus = "pending" | "up" | "down";
export type MonitorInterval = 1 | 5 | 15 | 30;

export type UptimeMonitor = {
  id: string;
  userId: string;
  name: string;
  url: string;
  method: MonitorMethod;
  expectedStatus: number;
  intervalMinutes: MonitorInterval;
  failureThreshold: number;
  enabled: boolean;
  status: MonitorStatus;
  consecutiveFailures: number;
  lastCheckedAt: string | null;
  createdAt: string;
};

export type UptimeCheck = {
  id: string;
  monitorId: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
  checkedAt: string;
};

export type UptimeIncident = {
  id: string;
  monitorId: string;
  startedAt: string;
  endedAt: string | null;
};

export type UptimeNotificationSettings = {
  userId: string;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  updatedAt: string;
};

export type SlackNotificationSettings = {
  userId: string;
  slackConfigured: boolean;
  slackEnabled: boolean;
  updatedAt: string;
};

export type LatencyRange = "24h" | "7d" | "30d";

export type LatencyBucket = {
  bucketStart: string;
  avgLatencyMs: number | null;
  okCount: number;
  totalCount: number;
};

export type DailyUptime = {
  date: string;
  uptimePercentage: number | null;
  okCount: number;
  totalCount: number;
};

export type UptimeStatsSummary = {
  monitorId: string;
  uptime24h: number | null;
  uptime7d: number | null;
  uptime30d: number | null;
};

export type MonitorSparkline = {
  monitorId: string;
  buckets: LatencyBucket[];
};

/** Everything the monitor detail page needs, fetched in one round trip. */
export type MonitorDetailData = {
  checks: UptimeCheck[];
  incidents: UptimeIncident[];
  stats: UptimeStatsSummary;
  latencyBuckets: LatencyBucket[];
  dailyUptime: DailyUptime[];
};
