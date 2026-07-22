import "server-only";

import type { InsForgeClient } from "@insforge/sdk";

import { UPTIME_CHECK_RETENTION_DAYS, UPTIME_CHECK_TIMEOUT_MS } from "../constants";
import type { MonitorMethod, MonitorStatus } from "../types";
import { sendTelegramMessage } from "./telegram";

type AdminDatabase = InsForgeClient["database"];

type MonitorRow = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  method: MonitorMethod;
  expected_status: number;
  interval_minutes: number;
  failure_threshold: number;
  status: MonitorStatus;
  consecutive_failures: number;
  last_checked_at: string | null;
};

type NotificationSettingsRow = {
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
};

type CheckResult = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
};

export type RunChecksDeps = {
  database: AdminDatabase;
  now?: () => Date;
  fetchImpl?: typeof fetch;
  sendTelegram?: typeof sendTelegramMessage;
};

export type RunChecksSummary = { checked: number };

const MONITOR_COLUMNS =
  "id,user_id,name,url,method,expected_status,interval_minutes,failure_threshold,status,consecutive_failures,last_checked_at";

function isMonitorDue(monitor: MonitorRow, now: Date): boolean {
  if (!monitor.last_checked_at) return true;
  const elapsedMs = now.getTime() - Date.parse(monitor.last_checked_at);
  return elapsedMs >= monitor.interval_minutes * 60_000;
}

async function performCheck(monitor: MonitorRow, fetchImpl: typeof fetch): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    const response = await fetchImpl(monitor.url, {
      method: monitor.method,
      signal: AbortSignal.timeout(UPTIME_CHECK_TIMEOUT_MS),
    });
    const latencyMs = Date.now() - startedAt;
    void response.body?.cancel().catch(() => {});
    const ok = response.status === monitor.expected_status;
    return {
      ok,
      statusCode: response.status,
      latencyMs,
      error: ok ? null : `Unexpected status ${response.status}`,
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const name = error instanceof Error ? error.name : "";
    const isTimeout = name === "TimeoutError" || name === "AbortError";
    return {
      ok: false,
      statusCode: null,
      latencyMs,
      error: (isTimeout
        ? "timeout"
        : error instanceof Error
          ? error.message
          : "Network error"
      ).slice(0, 500),
    };
  }
}

async function notifyIfConfigured(
  database: AdminDatabase,
  sendTelegram: typeof sendTelegramMessage,
  userId: string,
  text: string,
): Promise<void> {
  const { data: settings } = await database
    .from("uptime_notification_settings")
    .select("telegram_bot_token,telegram_chat_id")
    .eq("user_id", userId)
    .maybeSingle();

  const row = settings as NotificationSettingsRow | null;
  if (!row?.telegram_bot_token || !row.telegram_chat_id) return;

  const result = await sendTelegram(row.telegram_bot_token, row.telegram_chat_id, text);
  if (!result.ok) {
    console.error(`[uptime-monitor] Telegram alert failed: ${result.message}`);
  }
}

async function closeOpenIncident(
  database: AdminDatabase,
  monitorId: string,
  nowIso: string,
): Promise<void> {
  const { data: openIncident } = await database
    .from("uptime_incidents")
    .select("id")
    .eq("monitor_id", monitorId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openIncident && typeof openIncident === "object" && "id" in openIncident) {
    await database
      .from("uptime_incidents")
      .update({ ended_at: nowIso })
      .eq("id", (openIncident as { id: string }).id);
  }
}

async function processMonitor(
  database: AdminDatabase,
  monitor: MonitorRow,
  now: Date,
  fetchImpl: typeof fetch,
  sendTelegram: typeof sendTelegramMessage,
): Promise<void> {
  const result = await performCheck(monitor, fetchImpl);
  const nowIso = now.toISOString();

  await database.from("uptime_checks").insert([
    {
      monitor_id: monitor.id,
      ok: result.ok,
      status_code: result.statusCode,
      latency_ms: result.latencyMs,
      error: result.error,
    },
  ]);

  let nextStatus: MonitorStatus = monitor.status;
  let nextFailures = monitor.consecutive_failures;
  let becameDown = false;
  let becameUp = false;

  if (result.ok) {
    nextFailures = 0;
    if (monitor.status === "down") becameUp = true;
    nextStatus = "up";
  } else {
    nextFailures = monitor.consecutive_failures + 1;
    if (nextFailures >= monitor.failure_threshold && monitor.status !== "down") {
      nextStatus = "down";
      becameDown = true;
    }
  }

  await database
    .from("uptime_monitors")
    .update({
      status: nextStatus,
      consecutive_failures: nextFailures,
      last_checked_at: nowIso,
    })
    .eq("id", monitor.id);

  if (becameDown) {
    await database
      .from("uptime_incidents")
      .insert([{ monitor_id: monitor.id, started_at: nowIso }]);
    await notifyIfConfigured(
      database,
      sendTelegram,
      monitor.user_id,
      `🔴 ${monitor.name} is down (${result.error ?? "check failed"}).\n${monitor.url}`,
    );
  } else if (becameUp) {
    await closeOpenIncident(database, monitor.id, nowIso);
    await notifyIfConfigured(
      database,
      sendTelegram,
      monitor.user_id,
      `🟢 ${monitor.name} recovered.\n${monitor.url}`,
    );
  }
}

async function cleanupOldChecks(database: AdminDatabase, now: Date): Promise<void> {
  const cutoff = new Date(
    now.getTime() - UPTIME_CHECK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await database.from("uptime_checks").delete().lt("checked_at", cutoff);
}

export async function runUptimeChecks(deps: RunChecksDeps): Promise<RunChecksSummary> {
  const { database } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const fetchImpl = deps.fetchImpl ?? fetch;
  const sendTelegram = deps.sendTelegram ?? sendTelegramMessage;

  const { data: monitors, error } = await database
    .from("uptime_monitors")
    .select(MONITOR_COLUMNS)
    .eq("enabled", true);
  if (error) throw new Error(error.message || "Failed to load monitors.");

  const dueMonitors = ((monitors ?? []) as MonitorRow[]).filter((monitor) =>
    isMonitorDue(monitor, now),
  );

  await Promise.allSettled(
    dueMonitors.map((monitor) => processMonitor(database, monitor, now, fetchImpl, sendTelegram)),
  );

  await cleanupOldChecks(database, now);

  return { checked: dueMonitors.length };
}
