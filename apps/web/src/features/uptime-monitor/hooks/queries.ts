"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  getMonitorDetailAction,
  getNotificationSettingsAction,
  getSlackNotificationSettingsAction,
  getSparklinesAction,
  listUptimeChecksAction,
  listUptimeMonitorsAction,
} from "../actions";
import { UPTIME_POLL_INTERVAL_MS } from "../constants";
import type { LatencyRange } from "../types";
import { uptimeMonitorKeys } from "./mutations";
import { usePageVisible } from "./use-page-visible";

function sparklinesKey(monitorIds: string[]): string {
  return [...monitorIds].sort().join(",");
}

export function useUptimeMonitorsQuery() {
  const user = useAuthUser();

  return useQuery({
    queryKey: uptimeMonitorKeys.monitors(user.id),
    queryFn: async () => {
      const result = await listUptimeMonitorsAction();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
  });
}

/** Checks within the last N hours, used to compute the 24h uptime % shown in the monitor list. */
export function useRecentUptimeChecksQuery(monitorId: string, sinceIso: string) {
  const user = useAuthUser();

  return useQuery({
    queryKey: [...uptimeMonitorKeys.checks(user.id, monitorId), "recent", sinceIso],
    queryFn: async () => {
      const result = await listUptimeChecksAction(monitorId, { sinceIso });
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
  });
}

/**
 * All detail-page data (checks, incidents, stats, latency buckets, daily uptime)
 * in one server round trip. Polls at half the monitor's check interval — the data
 * only changes when the cron writes a new check.
 */
export function useMonitorDetailQuery(
  monitorId: string,
  range: LatencyRange,
  intervalMinutes: number | undefined,
) {
  const user = useAuthUser();
  const visible = usePageVisible();

  const pollMs = Math.max(UPTIME_POLL_INTERVAL_MS, ((intervalMinutes ?? 1) * 60_000) / 2);

  return useQuery({
    queryKey: uptimeMonitorKeys.detail(user.id, monitorId, range),
    queryFn: async () => {
      const result = await getMonitorDetailAction(monitorId, range);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    refetchInterval: visible ? pollMs : false,
    placeholderData: keepPreviousData,
  });
}

export function useNotificationSettingsQuery() {
  const user = useAuthUser();

  return useQuery({
    queryKey: uptimeMonitorKeys.settings(user.id),
    queryFn: async () => {
      const result = await getNotificationSettingsAction();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useSlackNotificationSettingsQuery() {
  const user = useAuthUser();

  return useQuery({
    queryKey: uptimeMonitorKeys.slackSettings(user.id),
    queryFn: async () => {
      const result = await getSlackNotificationSettingsAction();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useSparklinesQuery(monitorIds: string[]) {
  const user = useAuthUser();
  const monitorIdsKey = sparklinesKey(monitorIds);

  return useQuery({
    queryKey: uptimeMonitorKeys.sparklines(user.id, monitorIdsKey),
    queryFn: async () => {
      const result = await getSparklinesAction(monitorIds);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: monitorIds.length > 0,
  });
}
