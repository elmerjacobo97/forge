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
