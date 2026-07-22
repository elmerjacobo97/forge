"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, History, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMonitorDetailQuery, useUptimeMonitorsQuery } from "../hooks/queries";
import type { LatencyRange } from "../types";
import { formatIncidentDuration, formatLatency, formatUptimePercentage } from "../utils/stats";
import { MonitorStatusBadge } from "./monitor-status-badge";
import { UptimeBarStrip } from "./uptime-bar-strip";

const LatencyChart = dynamic(
  () => import("./latency-chart").then((mod) => mod.LatencyChart),
  { ssr: false, loading: () => <Skeleton className="h-50 w-full" /> },
);

type MonitorDetailProps = {
  monitorId: string;
};

function BackToMonitorsButton() {
  return (
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
  );
}

export function MonitorDetail({ monitorId }: MonitorDetailProps) {
  const [range, setRange] = useState<LatencyRange>("24h");
  const { data: monitors = [], isLoading: monitorsLoading } = useUptimeMonitorsQuery();
  const monitor = monitors.find((m) => m.id === monitorId) ?? null;
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorValue,
  } = useMonitorDetailQuery(monitorId, range, monitor?.intervalMinutes);

  const checks = detail?.checks ?? [];
  const incidents = detail?.incidents ?? [];

  if (!monitorsLoading && !monitor) {
    return (
      <div className="flex h-full flex-col gap-4">
        <BackToMonitorsButton />
        <Alert variant="destructive">
          <AlertTitle>Monitor not found</AlertTitle>
          <AlertDescription>
            It may have been deleted, or it belongs to another account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="flex h-full flex-col gap-4">
        <BackToMonitorsButton />
        <Alert variant="destructive">
          <AlertTitle>Could not load monitor data</AlertTitle>
          <AlertDescription>{detailErrorValue.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <BackToMonitorsButton />
        {monitor ? (
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="text-sm font-medium">{monitor.name}</h2>
            <MonitorStatusBadge status={monitor.status} />
            {!monitor.enabled ? <Badge variant="secondary">Paused</Badge> : null}
            <a
              href={monitor.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {monitor.url}
            </a>
          </div>
        ) : (
          <Skeleton className="h-5 w-48" />
        )}

        <div className="flex flex-wrap gap-4 text-xs">
          <StatChip
            label="24h"
            value={detail?.stats.uptime24h ?? null}
            loading={detailLoading}
          />
          <StatChip
            label="7d"
            value={detail?.stats.uptime7d ?? null}
            loading={detailLoading}
          />
          <StatChip
            label="30d"
            value={detail?.stats.uptime30d ?? null}
            loading={detailLoading}
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <LatencyChart
          buckets={detail?.latencyBuckets ?? []}
          range={range}
          onRangeChange={setRange}
          loading={detailLoading}
        />
        <UptimeBarStrip
          days={detail?.dailyUptime ?? []}
          loading={detailLoading}
        />
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Check history</span>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-input/60">
            {detailLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[1, 2, 3].map((index) => (
                  <Skeleton
                    key={index}
                    className="h-8 w-full"
                  />
                ))}
              </div>
            ) : checks.length === 0 ? (
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <History />
                  </EmptyMedia>
                  <EmptyTitle>No checks yet</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    The first check runs on the monitor&apos;s schedule.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <span
                          className={
                            check.ok
                              ? "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                              : "inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                          }
                        >
                          {check.statusCode ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatLatency(check.latencyMs)}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                        {check.error ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(check.checkedAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Recent incidents</span>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-input/60">
            {detailLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[1, 2].map((index) => (
                  <Skeleton
                    key={index}
                    className="h-8 w-full"
                  />
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShieldAlert />
                  </EmptyMedia>
                  <EmptyTitle>No incidents</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    This monitor hasn&apos;t gone down yet.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(incident.startedAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {incident.endedAt ? (
                          formatIncidentDuration(incident.startedAt, incident.endedAt)
                        ) : (
                          <Badge variant="destructive">Ongoing</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | null;
  loading: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-lg border border-input/60 px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <span className="font-medium tabular-nums">{formatUptimePercentage(value)}</span>
      )}
    </div>
  );
}
