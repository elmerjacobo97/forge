"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { UPTIME_UPTIME_WINDOW_HOURS } from "../constants";
import { useSetUptimeMonitorEnabledMutation } from "../hooks/mutations";
import { useRecentUptimeChecksQuery } from "../hooks/queries";
import type { LatencyBucket, UptimeMonitor } from "../types";
import { computeUptimePercentage, formatLatency, formatUptimePercentage } from "../utils/stats";
import { MonitorSparkline } from "./monitor-sparkline";
import { MonitorStatusBadge } from "./monitor-status-badge";

type MonitorTableRowProps = {
  monitor: UptimeMonitor;
  sparklineBuckets: LatencyBucket[];
  sparklinesLoading?: boolean;
  onEdit: (monitor: UptimeMonitor) => void;
  onDelete: (monitor: UptimeMonitor) => void;
};

export function MonitorTableRow({
  monitor,
  sparklineBuckets,
  sparklinesLoading = false,
  onEdit,
  onDelete,
}: MonitorTableRowProps) {
  const [sinceIso] = useState(() =>
    new Date(Date.now() - UPTIME_UPTIME_WINDOW_HOURS * 60 * 60 * 1000).toISOString(),
  );
  const { data: recentChecks = [] } = useRecentUptimeChecksQuery(monitor.id, sinceIso);
  const toggleMutation = useSetUptimeMonitorEnabledMutation();

  const lastCheck = recentChecks[0] ?? null;
  const uptimePercentage = computeUptimePercentage(recentChecks);

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/uptime-monitor/${monitor.id}`}
          className="font-medium hover:underline"
        >
          {monitor.name}
        </Link>
        <div className="max-w-64 truncate text-xs text-muted-foreground">{monitor.url}</div>
      </TableCell>
      <TableCell>
        <MonitorStatusBadge status={monitor.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {lastCheck ? formatLatency(lastCheck.latencyMs) : "—"}
      </TableCell>
      <TableCell>
        <MonitorSparkline
          buckets={sparklineBuckets}
          isLoading={sparklinesLoading}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatUptimePercentage(uptimePercentage)}
      </TableCell>
      <TableCell>
        <Switch
          checked={monitor.enabled}
          disabled={toggleMutation.isPending}
          onCheckedChange={(enabled) => toggleMutation.mutate({ monitorId: monitor.id, enabled })}
          aria-label={monitor.enabled ? "Pause monitor" : "Resume monitor"}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onEdit(monitor)}
            aria-label="Edit monitor"
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onDelete(monitor)}
            aria-label="Delete monitor"
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
