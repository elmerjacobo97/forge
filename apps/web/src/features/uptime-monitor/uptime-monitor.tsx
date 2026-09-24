import { HugeiconsIcon } from "@hugeicons/react";
import { Activity01Icon } from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UPTIME_MAX_MONITORS_PER_USER } from "./constants";
import { UptimeMonitorHeader } from "./components/uptime-monitor-header";
import { MonitorTableRow } from "./components/monitor-table-row";
import type {
  MonitorRowData,
  SlackNotificationSettings,
  UptimeNotificationSettings,
} from "./types";

export function UptimeMonitor({
  rows,
  telegramSettings,
  slackSettings,
}: {
  rows: MonitorRowData[];
  telegramSettings: UptimeNotificationSettings | null;
  slackSettings: SlackNotificationSettings | null;
}) {
  const atLimit = rows.length >= UPTIME_MAX_MONITORS_PER_USER;

  return (
    <div className="flex h-full flex-col gap-4">
      <UptimeMonitorHeader
        monitorCount={rows.length}
        atLimit={atLimit}
        telegramSettings={telegramSettings}
        slackSettings={slackSettings}
      />

      {atLimit ? (
        <Alert>
          <AlertTitle>Monitor limit reached</AlertTitle>
          <AlertDescription>
            Delete a monitor before creating another (max {UPTIME_MAX_MONITORS_PER_USER}).
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto border border-input/60">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <HugeiconsIcon
              icon={Activity01Icon}
              strokeWidth={2}
              className="size-8 text-muted-foreground/40"
            />
            <p className="text-sm font-medium">No monitors yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Create a monitor to check one of your URLs on a schedule and get alerted on Telegram
              when it goes down.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monitor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last latency</TableHead>
                <TableHead>24h trend</TableHead>
                <TableHead>Uptime (24h)</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <MonitorTableRow
                  key={row.monitor.id}
                  row={row}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
