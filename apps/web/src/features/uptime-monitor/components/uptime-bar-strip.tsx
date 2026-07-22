"use client";

import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DailyUptime } from "../types";
import type { UptimeBarLevel } from "../utils/chart-data";
import {
  formatDailyUptimeTooltip,
  hasDailyUptimeData,
  toDailyUptimeChartData,
} from "../utils/chart-data";
import { formatUptimePercentage } from "../utils/stats";

const LEVEL_CLASS: Record<UptimeBarLevel, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  empty: "bg-muted",
};

type UptimeBarStripProps = {
  days: DailyUptime[];
  loading: boolean;
};

export function UptimeBarStrip({ days, loading }: UptimeBarStripProps) {
  const points = toDailyUptimeChartData(days);
  const hasData = hasDailyUptimeData(days);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Uptime</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : !hasData ? (
          <Empty className="min-h-16 border-0 py-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>No uptime history yet</EmptyTitle>
              <EmptyDescription>
                Daily availability will appear after the first checks.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex h-8 w-full items-stretch gap-0.5">
              {points.map((point) => (
                <Tooltip key={point.date}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "min-w-0 flex-1 rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring",
                        LEVEL_CLASS[point.level],
                      )}
                      aria-label={`${formatDailyUptimeTooltip(point.date)}: ${formatUptimePercentage(point.uptimePercentage)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-0.5">
                      <span>{formatDailyUptimeTooltip(point.date)}</span>
                      <span className="tabular-nums">
                        {point.uptimePercentage === null
                          ? "No data"
                          : formatUptimePercentage(point.uptimePercentage)}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{points[0]?.label}</span>
              <span>{points[points.length - 1]?.label}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
