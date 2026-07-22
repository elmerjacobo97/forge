"use client";

import { Line, LineChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { LatencyBucket } from "../types";
import { hasLatencySeriesData, toLatencyChartData } from "../utils/chart-data";

const sparklineConfig = {
  avgLatencyMs: {
    label: "Latency",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type MonitorSparklineProps = {
  buckets: LatencyBucket[];
  isLoading?: boolean;
};

export function MonitorSparkline({ buckets, isLoading = false }: MonitorSparklineProps) {
  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  if (!hasLatencySeriesData(buckets)) {
    return (
      <div
        className="flex h-8 w-24 items-center text-xs text-muted-foreground"
        aria-label="No latency data"
      >
        —
      </div>
    );
  }

  const chartData = toLatencyChartData(buckets, "24h");

  return (
    <ChartContainer
      config={sparklineConfig}
      className="aspect-auto h-8 w-24"
      aria-label="24-hour latency sparkline"
    >
      <LineChart
        data={chartData}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        <Line
          type="monotone"
          dataKey="avgLatencyMs"
          stroke="var(--color-avgLatencyMs)"
          strokeWidth={1.5}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
