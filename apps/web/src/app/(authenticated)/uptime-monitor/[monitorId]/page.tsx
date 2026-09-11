import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/server";
import { MonitorDetail } from "@/features/uptime-monitor/components/monitor-detail";
import { uptimeMonitorService } from "@/features/uptime-monitor/services/uptime-monitor-service";

export default async function UptimeMonitorDetailPage({
  params,
}: PageProps<"/uptime-monitor/[monitorId]">) {
  const { monitorId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [monitors, initialDetail] = await Promise.all([
    uptimeMonitorService.listMonitors(user.id),
    uptimeMonitorService.getMonitorDetail(monitorId, "24h", user.id),
  ]);
  const monitor = monitors.find((item) => item.id === monitorId) ?? null;

  if (!monitor) {
    return (
      <div className="flex h-full flex-col gap-4">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="w-fit"
        >
          <Link href="/uptime-monitor">
            <ArrowLeft data-icon="inline-start" />
            Back to monitors
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Monitor not found</AlertTitle>
          <AlertDescription>
            It may have been deleted, or it belongs to another account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <MonitorDetail
      monitor={monitor}
      initialDetail={initialDetail}
    />
  );
}
