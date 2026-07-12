import { Suspense, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Download,
  Gauge,
  ListChecks,
  PauseCircle,
  Timer,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroupItem, ToggleGroup } from "@/components/ui/toggle-group";
import { useUserQuery } from "@/features/auth/hooks/queries";
import { AnalyticsPreset } from "@/features/dev-board/types/analytics";
import { AnalyticsCharts } from "@/features/dev-board/components/analytics-charts";
import { AnalyticsSkeleton } from "@/features/dev-board/components/analytics-skeleton";
import { ChartsSkeleton } from "@/features/dev-board/components/charts-skeleton";
import { SectionEyebrow } from "@/features/dev-board/components/section-eyebrow";
import { StatItem } from "@/features/dev-board/components/stat-item";
import { useDevBoardAnalytics } from "@/features/dev-board/hooks/queries";
import { PRIORITY_COLORS } from "@/features/dev-board/types/board";
import {
  downloadCsv,
  formatRangeLabel,
} from "@/features/dev-board/utils/analytics-range";
import { analyticsCsv, buildAnalytics, presetRange } from "@/features/dev-board/utils/analytics";
import { formatDuration } from "@/features/dev-board/utils/timer";

export const Route = createFileRoute("/_authenticated/dev-board_/analytics")({
  component: AnalyticsRoute,
});

function formatCustomRange(range: DateRange | undefined): string {
  if (!range?.from) return "Select date range";
  if (!range.to) return format(range.from, "MMM d, yyyy");
  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

function lastFifteenDays(): DateRange {
  const today = new Date();
  return { from: subDays(today, 14), to: today };
}

function AnalyticsRoute() {
  const { data: user } = useUserQuery();
  const [preset, setPreset] = useState<AnalyticsPreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const range = useMemo(
    () => {
      if (preset !== "custom") return presetRange(preset);
      const from = customRange?.from;
      const to = customRange?.to;
      if (!from || !to) return undefined;
      return {
        from: startOfDay(from).toISOString(),
        to: endOfDay(to).toISOString(),
      };
    },
    [preset, customRange],
  );
  const analyticsQuery = useDevBoardAnalytics(user?.id, range);
  const summary = analyticsQuery.data && range ? buildAnalytics(analyticsQuery.data, range) : null;
  const maxTicketDuration = summary?.topTickets[0]?.durationMs ?? 0;

  function selectPreset(value: string) {
    if (!value) return;
    const nextPreset = value as AnalyticsPreset;
    if (nextPreset === "custom") setCustomRange(lastFifteenDays());
    setPreset(nextPreset);
  }

  function selectCustomRange(nextRange: DateRange | undefined) {
    setCustomRange(nextRange);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-heading text-lg font-semibold">Dev Board Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Work trends, cycle time, and time invested.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link to="/dev-board">
              <ArrowLeft className="size-3.5" />
              Dev Board
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => summary && downloadCsv(analyticsCsv(summary))}
            disabled={!summary}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            value={preset}
            onValueChange={selectPreset}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
            <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
            <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
          </ToggleGroup>
          {preset === "custom" && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-56 justify-start text-left font-normal">
                  <CalendarDays className="size-3.5" />
                  {formatCustomRange(customRange)}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Card className="w-fit p-0">
                  <CardContent className="p-0">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={selectCustomRange}
                      defaultMonth={customRange?.from}
                      numberOfMonths={2}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {range ? formatRangeLabel(range) : "Select an end date"}
          </span>
        </CardContent>
      </Card>

      <div className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 pb-6 *:shrink-0">
          {analyticsQuery.isLoading ? (
            <AnalyticsSkeleton />
          ) : analyticsQuery.error ? (
            <Card>
              <CardContent className="p-6 text-sm text-destructive">
                {analyticsQuery.error.message}
              </CardContent>
            </Card>
          ) : summary ? (
            <>
              <Card>
                <CardContent className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
                  <StatItem
                    icon={<ListChecks className="size-4" />}
                    label="Completed"
                    value={summary.completed}
                    trend={summary.throughput.map((point) => point.completed)}
                  />
                  <StatItem
                    icon={<Timer className="size-4" />}
                    label="Time logged"
                    value={formatDuration(summary.loggedMs)}
                    trend={summary.loggedTime.map((point) => point.durationMs)}
                  />
                  <StatItem
                    icon={<Gauge className="size-4" />}
                    label="Average cycle"
                    value={summary.averageCycleMs ? formatDuration(summary.averageCycleMs) : "–"}
                  />
                  <StatItem
                    icon={<Activity className="size-4" />}
                    label="Active"
                    value={summary.active}
                  />
                  <StatItem
                    icon={<PauseCircle className="size-4" />}
                    label="Paused"
                    value={summary.paused}
                  />
                </CardContent>
              </Card>

              <SectionEyebrow>Trends</SectionEyebrow>
              <Suspense fallback={<ChartsSkeleton />}>
                <AnalyticsCharts summary={summary} />
              </Suspense>

              <SectionEyebrow>Leaderboard</SectionEyebrow>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="size-4 text-muted-foreground" />
                    Longest tickets
                  </CardTitle>
                  <CardDescription>
                    {summary.longestTicket
                      ? `${summary.longestTicket.title} has the most logged time.`
                      : "No time entries in this range."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topTickets.length ? (
                    <ItemGroup>
                      {summary.topTickets.map(({ ticket, durationMs }, index) => (
                        <Item
                          key={ticket.id}
                          variant="outline"
                        >
                          <ItemMedia>
                            <span className="flex size-6 items-center justify-center rounded-full bg-muted font-mono text-xs tabular-nums">
                              {index + 1}
                            </span>
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>
                              <span
                                aria-hidden
                                className={`size-1.5 shrink-0 rounded-full ${PRIORITY_COLORS[ticket.priority]}`}
                              />
                              {ticket.title}
                            </ItemTitle>
                            <Progress
                              value={(durationMs / (maxTicketDuration || 1)) * 100}
                              className="h-1.5"
                            />
                          </ItemContent>
                          <ItemActions>
                            <span className="font-mono text-sm tabular-nums text-muted-foreground">
                              {formatDuration(durationMs)}
                            </span>
                          </ItemActions>
                        </Item>
                      ))}
                    </ItemGroup>
                  ) : (
                    <Empty>
                      <EmptyMedia variant="icon">
                        <Trophy className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No time entries yet</EmptyTitle>
                      <EmptyDescription>
                        Start a timer on a ticket to see it ranked here.
                      </EmptyDescription>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
