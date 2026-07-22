import { MonitorDetail } from "@/features/uptime-monitor/components/monitor-detail";

export default async function UptimeMonitorDetailPage({
  params,
}: PageProps<"/uptime-monitor/[monitorId]">) {
  const { monitorId } = await params;
  return <MonitorDetail monitorId={monitorId} />;
}
