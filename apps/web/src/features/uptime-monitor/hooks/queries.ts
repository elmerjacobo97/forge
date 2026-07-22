"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  getNotificationSettingsAction,
  listUptimeChecksAction,
  listUptimeIncidentsAction,
  listUptimeMonitorsAction,
} from "../actions";
import { UPTIME_CHECK_HISTORY_LIMIT, UPTIME_POLL_INTERVAL_MS } from "../constants";
import { uptimeMonitorKeys } from "./mutations";
import { usePageVisible } from "./use-page-visible";

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

export function useUptimeMonitorChecksQuery(monitorId: string | null) {
  const user = useAuthUser();
  const visible = usePageVisible();

  return useQuery({
    queryKey: uptimeMonitorKeys.checks(user.id, monitorId ?? "none"),
    queryFn: async () => {
      if (!monitorId) return [];
      const result = await listUptimeChecksAction(monitorId, {
        limit: UPTIME_CHECK_HISTORY_LIMIT,
      });
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: Boolean(monitorId),
    refetchInterval: monitorId && visible ? UPTIME_POLL_INTERVAL_MS : false,
  });
}

export function useUptimeMonitorIncidentsQuery(monitorId: string | null) {
  const user = useAuthUser();
  const visible = usePageVisible();

  return useQuery({
    queryKey: uptimeMonitorKeys.incidents(user.id, monitorId ?? "none"),
    queryFn: async () => {
      if (!monitorId) return [];
      const result = await listUptimeIncidentsAction(monitorId);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: Boolean(monitorId),
    refetchInterval: monitorId && visible ? UPTIME_POLL_INTERVAL_MS : false,
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
