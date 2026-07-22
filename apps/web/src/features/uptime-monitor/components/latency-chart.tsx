"use client";

import { Activity } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LatencyBucket, LatencyRange } from "../types";
import {
  formatLatencyAxisLabel,
  hasLatencySeriesData,
  toLatencyChartData,
} from "../utils/chart-data";
import { formatLatency } from "../utils/stats";

const RANGES: { value: LatencyRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

const chartConfig = {
  avgLatencyMs: {
    label: "Latency",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type LatencyChartProps = {
  buckets: LatencyBucket[];
  range: LatencyRange;
  onRangeChange: (range: LatencyRange) => void;
  loading: boolean;
};

export function LatencyChart({ buckets, range, onRangeChange, loading }: LatencyChartProps) {
  const chartData = toLatencyChartData(buckets, range);
  const hasData = hasLatencySeriesData(buckets);

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>Latency</CardTitle>
        <CardDescription>Average response time by range (ms)</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => {
              if (value === "24h" || value === "7d" || value === "30d") {
                onRangeChange(value);
              }
            }}
            variant="outline"
            size="sm"
            aria-label="Latency range"
          >
            {RANGES.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-50 w-full" />
        ) : !hasData ? (
          <Empty className="min-h-50 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>No latency data yet</EmptyTitle>
              <EmptyDescription>
                Checks will appear here once this monitor has run.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-50 w-full"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="bucketStart"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(value: string) => formatLatencyAxisLabel(value, range)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                tickMargin={4}
                tickFormatter={(value: number) => String(Math.round(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => formatLatencyAxisLabel(String(value), range)}
                    formatter={(value) => {
                      if (value == null || Number.isNaN(Number(value))) {
                        return ["—", "Latency"];
                      }
                      return [formatLatency(Number(value)), "Latency"];
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="avgLatencyMs"
                stroke="var(--color-avgLatencyMs)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
