"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  Download01Icon,
  GaugeIcon,
  ListChecksIcon,
  PauseCircleIcon,
  Timer01Icon,
  TrophyIcon,
} from "@hugeicons/core-free-icons";

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
import type { AnalyticsPreset, AnalyticsRange, AnalyticsSummary } from "../types/analytics";
import { PRIORITY_COLORS } from "../types/board";
import type { Project } from "../types/project";
import { downloadCsv, formatRangeLabel } from "../utils/analytics-range";
import { analyticsCsv } from "../utils/analytics";
import { formatDuration } from "../utils/timer";
import { StatItem } from "./stat-item";

function formatCustomRange(range: DateRange | undefined): string {
  if (!range?.from) return "Select date range";
  if (!range.to) return format(range.from, "MMM d, yyyy");
  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

export function AnalyticsHeader({
  project,
  summary,
}: {
  project: Project;
  summary: AnalyticsSummary | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <h2 className="truncate font-heading text-lg font-semibold">{project.name} analytics</h2>
        <p className="text-sm text-muted-foreground">
          Work trends, cycle time, and time invested for this project.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
        >
          <Link href={`/dev-board/${project.id}`}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Board
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => summary && downloadCsv(analyticsCsv(summary))}
          disabled={!summary}
        >
          <HugeiconsIcon
            icon={Download01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

interface AnalyticsRangeControlsProps {
  preset: AnalyticsPreset;
  onPresetChange: (value: string) => void;
  customRange: DateRange | undefined;
  onCustomRangeChange: (range: DateRange | undefined) => void;
  range: AnalyticsRange | undefined;
}

export function AnalyticsRangeControls({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
  range,
}: AnalyticsRangeControlsProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={preset}
          onValueChange={onPresetChange}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
          <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
          <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
          <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
        </ToggleGroup>
        {preset === "custom" && (
          <Popover
            open={isCalendarOpen}
            onOpenChange={setIsCalendarOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-56 justify-start text-left font-normal"
              >
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                {formatCustomRange(customRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto p-0"
            >
              <Card className="w-fit p-0">
                <CardContent className="p-0">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={onCustomRangeChange}
                    defaultMonth={customRange?.from}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
  );
}

export function AnalyticsStatsCard({ summary }: { summary: AnalyticsSummary }) {
  return (
    <Card>
      <CardContent className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <StatItem
          icon={
            <HugeiconsIcon
              icon={ListChecksIcon}
              strokeWidth={2}
              className="size-4"
            />
          }
          label="Completed"
          value={summary.completed}
        />
        <StatItem
          icon={
            <HugeiconsIcon
              icon={Timer01Icon}
              strokeWidth={2}
              className="size-4"
            />
          }
          label="Time logged"
          value={formatDuration(summary.loggedMs)}
        />
        <StatItem
          icon={
            <HugeiconsIcon
              icon={GaugeIcon}
              strokeWidth={2}
              className="size-4"
            />
          }
          label="Average cycle"
          value={summary.averageCycleMs ? formatDuration(summary.averageCycleMs) : "–"}
        />
        <StatItem
          icon={
            <HugeiconsIcon
              icon={Activity01Icon}
              strokeWidth={2}
              className="size-4"
            />
          }
          label="Active"
          value={summary.active}
        />
        <StatItem
          icon={
            <HugeiconsIcon
              icon={PauseCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
          }
          label="Paused"
          value={summary.paused}
        />
      </CardContent>
    </Card>
  );
}

export function AnalyticsLeaderboard({ summary }: { summary: AnalyticsSummary }) {
  const maxTicketDuration = summary.topTickets[0]?.durationMs ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon
            icon={TrophyIcon}
            strokeWidth={2}
            className="size-4 text-muted-foreground"
          />
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
                  <span className="flex size-6 items-center justify-center bg-muted font-mono text-xs tabular-nums">
                    {index + 1}
                  </span>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span
                      aria-hidden
                      className={`size-1.5 shrink-0 ${PRIORITY_COLORS[ticket.priority]}`}
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
              <HugeiconsIcon
                icon={TrophyIcon}
                strokeWidth={2}
                className="size-4"
              />
            </EmptyMedia>
            <EmptyTitle>No time entries yet</EmptyTitle>
            <EmptyDescription>Start a timer on a ticket to see it ranked here.</EmptyDescription>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
