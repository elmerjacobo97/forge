"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";
import { endOfDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Card, CardContent } from "@/components/ui/card";
import { useAnalytics } from "../hooks/use-analytics";
import { AnalyticsPreset, type AnalyticsData, type AnalyticsRange } from "../types/analytics";
import type { Project } from "../types/project";
import { buildAnalytics, presetRange } from "../utils/analytics";
import {
  AnalyticsHeader,
  AnalyticsLeaderboard,
  AnalyticsRangeControls,
  AnalyticsStatsCard,
} from "./analytics-sections";
import { AnalyticsSkeleton } from "./analytics-skeleton";
import { ChartsSkeleton } from "./charts-skeleton";

const AnalyticsCharts = dynamic(
  () => import("./analytics-charts").then((mod) => mod.AnalyticsCharts),
  { ssr: false, loading: () => <ChartsSkeleton /> },
);

function lastFifteenDays(): DateRange {
  const today = new Date();
  return { from: subDays(today, 14), to: today };
}

interface ProjectAnalyticsProps {
  project: Project;
  initialRange: AnalyticsRange;
  initialAnalytics: AnalyticsData;
}

export function ProjectAnalytics({
  project,
  initialRange,
  initialAnalytics,
}: ProjectAnalyticsProps) {
  const [preset, setPreset] = useState<AnalyticsPreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const range = useMemo(() => {
    if (preset !== "custom") return presetRange(preset);
    const from = customRange?.from;
    const to = customRange?.to;
    if (!from || !to) return undefined;
    return {
      from: startOfDay(from).toISOString(),
      to: endOfDay(to).toISOString(),
    };
  }, [preset, customRange]);

  const {
    data: analytics,
    error,
    isLoading,
  } = useAnalytics(project.id, range, initialRange, initialAnalytics);
  const summary = analytics && range ? buildAnalytics(analytics, range) : null;

  function selectPreset(value: string) {
    if (!value) return;
    const nextPreset = value as AnalyticsPreset;
    if (nextPreset === "custom") setCustomRange(lastFifteenDays());
    setPreset(nextPreset);
  }

  return (
    <div className="flex flex-col gap-4">
      <AnalyticsHeader
        project={project}
        summary={summary}
      />

      <AnalyticsRangeControls
        preset={preset}
        onPresetChange={selectPreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        range={range}
      />

      <div className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 pb-6 *:shrink-0">
          {isLoading ? (
            <AnalyticsSkeleton />
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : summary ? (
            <>
              <AnalyticsStatsCard summary={summary} />

              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Trends
              </p>
              <Suspense fallback={<ChartsSkeleton />}>
                <AnalyticsCharts summary={summary} />
              </Suspense>

              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Leaderboard
              </p>
              <AnalyticsLeaderboard summary={summary} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
