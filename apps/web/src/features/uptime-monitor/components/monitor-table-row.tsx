"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { setUptimeMonitorEnabledAction } from "../actions";
import type { MonitorRowData } from "../types";
import { formatLatency, formatUptimePercentage } from "../utils/stats";
import { DeleteMonitorDialog } from "./delete-monitor-dialog";
import { MonitorFormDialog } from "./monitor-form-dialog";
import { MonitorStatusBadge } from "./monitor-status-badge";

const MonitorSparkline = dynamic(
  () => import("./monitor-sparkline").then((mod) => mod.MonitorSparkline),
  { ssr: false, loading: () => <Skeleton className="h-8 w-24" /> },
);

export function MonitorTableRow({ row }: { row: MonitorRowData }) {
  const { monitor, sparklineBuckets, lastLatencyMs, uptimePercentage } = row;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isToggling, startToggling] = useTransition();

  function toggleEnabled(enabled: boolean) {
    startToggling(async () => {
      const result = await setUptimeMonitorEnabledAction(monitor.id, enabled);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(enabled ? "Monitor resumed." : "Monitor paused.");
    });
  }

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
        {lastLatencyMs === null ? "—" : formatLatency(lastLatencyMs)}
      </TableCell>
      <TableCell>
        <MonitorSparkline
          buckets={sparklineBuckets}
          isLoading={false}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatUptimePercentage(uptimePercentage)}
      </TableCell>
      <TableCell>
        <Switch
          checked={monitor.enabled}
          disabled={isToggling}
          onCheckedChange={toggleEnabled}
          aria-label={monitor.enabled ? "Pause monitor" : "Resume monitor"}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setIsEditOpen(true)}
            aria-label="Edit monitor"
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              strokeWidth={2}
            />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setIsDeleteOpen(true)}
            aria-label="Delete monitor"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
            />
          </Button>
        </div>
      </TableCell>

      {isEditOpen ? (
        <MonitorFormDialog
          monitor={monitor}
          isOpen
          onOpenChange={setIsEditOpen}
        />
      ) : null}

      {isDeleteOpen ? (
        <DeleteMonitorDialog
          monitor={monitor}
          isOpen
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </TableRow>
  );
}
