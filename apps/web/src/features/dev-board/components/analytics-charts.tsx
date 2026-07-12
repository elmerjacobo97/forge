import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

import type { AnalyticsSummary } from "../types/analytics";
import { COLUMN_LABELS, COLUMNS, PRIORITY_LABELS, type Priority } from "../types/board";
import { formatDuration } from "../utils/timer";

const PRIORITY_HEX: Record<Priority, string> = { low: "#0ea5e9", med: "#f59e0b", high: "#f43f5e" };

const throughputConfig = {
  completed: { label: "Completed", color: "var(--chart-1)" },
} satisfies ChartConfig;

const loggedTimeConfig = {
  durationMs: { label: "Time logged", color: "var(--chart-1)" },
} satisfies ChartConfig;

const statusConfig = Object.fromEntries(
  COLUMNS.map((column, index) => [column, { label: COLUMN_LABELS[column], color: `var(--chart-${(index % 5) + 1})` }]),
) satisfies ChartConfig;

const priorityConfig = {
  low: { label: PRIORITY_LABELS.low, color: PRIORITY_HEX.low },
  med: { label: PRIORITY_LABELS.med, color: PRIORITY_HEX.med },
  high: { label: PRIORITY_LABELS.high, color: PRIORITY_HEX.high },
} satisfies ChartConfig;

function shortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function minutesTick(value: number): string {
  return `${Math.round(value / 60_000)}m`;
}

export function AnalyticsCharts({ summary }: { summary: AnalyticsSummary }) {
  const totalTickets = summary.status.reduce((total, item) => total + item.count, 0);
  const priorityIsEmpty = summary.priority.every((item) => item.durationMs === 0);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        swatch="var(--chart-1)"
        title="Completed tickets"
        description="Throughput by day"
        isEmpty={summary.throughput.length === 0}
        emptyLabel="No tickets completed in this range yet."
      >
        <ChartContainer config={throughputConfig}>
          <BarChart data={summary.throughput} margin={{ left: -16 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(value) => shortDate(String(value))} />}
            />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        swatch="var(--chart-1)"
        title="Time logged"
        description="Recorded focus time by day"
        isEmpty={summary.loggedTime.length === 0}
        emptyLabel="No focus time recorded in this range yet."
      >
        <ChartContainer config={loggedTimeConfig}>
          <AreaChart data={summary.loggedTime} margin={{ left: -16 }}>
            <defs>
              <linearGradient id="fillLoggedTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-durationMs)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-durationMs)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickFormatter={minutesTick} tickLine={false} axisLine={false} width={36} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) => shortDate(String(value))}
                  formatter={(value) => [formatDuration(Number(value)), " logged"]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="durationMs"
              stroke="var(--color-durationMs)"
              strokeWidth={2}
              fill="url(#fillLoggedTime)"
            />
          </AreaChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard swatch="var(--chart-1)" title="Current status" description="Tickets by board column">
        <div className="relative">
          <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-64">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="column" hideLabel />} />
              <Pie data={summary.status} dataKey="count" nameKey="column" innerRadius={55} outerRadius={85} strokeWidth={3}>
                {summary.status.map((item) => (
                  <Cell key={item.column} fill={`var(--color-${item.column})`} stroke="var(--card)" />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="column" />} />
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-x-0 top-[38%] flex -translate-y-1/2 flex-col items-center">
            <span className="text-2xl font-semibold tabular-nums">{totalTickets}</span>
            <span className="text-xs text-muted-foreground">tickets</span>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        swatch={PRIORITY_HEX.med}
        title="Time by priority"
        description="Logged time across ticket priorities"
        isEmpty={priorityIsEmpty}
        emptyLabel="No logged time to break down by priority yet."
      >
        <ChartContainer config={priorityConfig}>
          <BarChart data={summary.priority} layout="vertical" margin={{ left: -8 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={minutesTick} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="priority"
              tickFormatter={(value: Priority) => PRIORITY_LABELS[value]}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="priority"
                  formatter={(value, _name, item) => [
                    formatDuration(Number(value)),
                    ` ${PRIORITY_LABELS[item.payload.priority as Priority]}`,
                  ]}
                />
              }
            />
            <Bar dataKey="durationMs" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {summary.priority.map((item) => (
                <Cell key={item.priority} fill={`var(--color-${item.priority})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  description,
  swatch,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  description: string;
  swatch: string;
  isEmpty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <Empty className="h-65">
            <EmptyMedia variant="icon">
              <Inbox className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Nothing here yet</EmptyTitle>
            <EmptyDescription>{emptyLabel}</EmptyDescription>
          </Empty>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
