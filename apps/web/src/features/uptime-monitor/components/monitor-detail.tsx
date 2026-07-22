"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, History, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useUptimeMonitorIncidentsQuery,
  useUptimeMonitorChecksQuery,
  useUptimeMonitorsQuery,
} from "../hooks/queries";
import { formatIncidentDuration, formatLatency } from "../utils/stats";
import { MonitorStatusBadge } from "./monitor-status-badge";

type MonitorDetailProps = {
  monitorId: string;
};

export function MonitorDetail({ monitorId }: MonitorDetailProps) {
  const { data: monitors = [], isLoading: monitorsLoading } = useUptimeMonitorsQuery();
  const {
    data: checks = [],
    isLoading: checksLoading,
    isError: checksError,
    error: checksErrorValue,
  } = useUptimeMonitorChecksQuery(monitorId);
  const {
    data: incidents = [],
    isLoading: incidentsLoading,
    isError: incidentsError,
    error: incidentsErrorValue,
  } = useUptimeMonitorIncidentsQuery(monitorId);

  const monitor = monitors.find((m) => m.id === monitorId) ?? null;

  if (!monitorsLoading && !monitor) {
    return (
      <div className="flex h-full flex-col gap-4">
        <Link
          href="/uptime-monitor"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to monitors
        </Link>
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
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Link
          href="/uptime-monitor"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to monitors
        </Link>
        {monitor ? (
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-medium">{monitor.name}</h2>
            <MonitorStatusBadge status={monitor.status} />
            {!monitor.enabled ? <Badge variant="secondary">Paused</Badge> : null}
            <a
              href={monitor.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {monitor.url}
            </a>
          </div>
        ) : (
          <div className="h-5 w-48 animate-pulse rounded bg-muted/40" />
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Check history</span>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-input/60">
            {checksError ? (
              <Alert
                variant="destructive"
                className="m-2"
              >
                <AlertTitle>Could not load checks</AlertTitle>
                <AlertDescription>{checksErrorValue.message}</AlertDescription>
              </Alert>
            ) : checksLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-8 animate-pulse rounded-lg bg-muted/40"
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
            {incidentsError ? (
              <Alert
                variant="destructive"
                className="m-2"
              >
                <AlertTitle>Could not load incidents</AlertTitle>
                <AlertDescription>{incidentsErrorValue.message}</AlertDescription>
              </Alert>
            ) : incidentsLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-8 animate-pulse rounded-lg bg-muted/40"
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
