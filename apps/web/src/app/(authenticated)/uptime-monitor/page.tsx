import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/server";
import { UPTIME_UPTIME_WINDOW_HOURS } from "@/features/uptime-monitor/constants";
import { uptimeMonitorService } from "@/features/uptime-monitor/services/uptime-monitor-service";
import type { MonitorRowData } from "@/features/uptime-monitor/types";
import { UptimeMonitor } from "@/features/uptime-monitor/uptime-monitor";
import { computeUptimePercentage } from "@/features/uptime-monitor/utils/stats";
import { windowStartIso } from "@/features/uptime-monitor/utils/window";

export default async function UptimeMonitorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const monitors = await uptimeMonitorService.listMonitors(user.id);
  const sinceIso = windowStartIso(UPTIME_UPTIME_WINDOW_HOURS);

  const [sparklines, checksByMonitor, telegramSettings, slackSettings] = await Promise.all([
    uptimeMonitorService.getSparklines(
      monitors.map((monitor) => monitor.id),
      user.id,
    ),
    Promise.all(
      monitors.map((monitor) => uptimeMonitorService.listChecks(monitor.id, user.id, { sinceIso })),
    ),
    uptimeMonitorService.getNotificationSettings(user.id),
    uptimeMonitorService.getSlackNotificationSettings(user.id),
  ]);

  const bucketsByMonitor = new Map(sparklines.map((line) => [line.monitorId, line.buckets]));
  const rows: MonitorRowData[] = monitors.map((monitor, index) => {
    const checks = checksByMonitor[index] ?? [];
    return {
      monitor,
      sparklineBuckets: bucketsByMonitor.get(monitor.id) ?? [],
      lastLatencyMs: checks[0]?.latencyMs ?? null,
      uptimePercentage: computeUptimePercentage(checks),
    };
  });

  return (
    <UptimeMonitor
      rows={rows}
      telegramSettings={telegramSettings}
      slackSettings={slackSettings}
    />
  );
}
