import { format, parseISO } from "date-fns";

import type { DailyUptime, LatencyBucket, LatencyRange } from "../types";

/** Epoch origin matching Postgres `date_bin(..., '1970-01-01')`. */
const BUCKET_ORIGIN_MS = Date.UTC(1970, 0, 1);

export type LatencyChartPoint = {
  bucketStart: string;
  label: string;
  avgLatencyMs: number | null;
  okCount: number;
  totalCount: number;
};

export type DailyUptimeChartPoint = {
  date: string;
  label: string;
  uptimePercentage: number | null;
  okCount: number;
  totalCount: number;
  level: UptimeBarLevel;
};

export type UptimeBarLevel = "good" | "warn" | "bad" | "empty";

type RangeBucketConfig = {
  bucketMs: number;
  lookbackMs: number;
};

export function getLatencyRangeConfig(range: LatencyRange): RangeBucketConfig {
  switch (range) {
    case "24h":
      return { bucketMs: 30 * 60_000, lookbackMs: 24 * 60 * 60_000 };
    case "7d":
      return { bucketMs: 3 * 60 * 60_000, lookbackMs: 7 * 24 * 60 * 60_000 };
    case "30d":
      return { bucketMs: 24 * 60 * 60_000, lookbackMs: 30 * 24 * 60 * 60_000 };
  }
}

function alignBucketStart(timestampMs: number, bucketMs: number): number {
  return (
    BUCKET_ORIGIN_MS + Math.floor((timestampMs - BUCKET_ORIGIN_MS) / bucketMs) * bucketMs
  );
}

export function formatLatencyAxisLabel(iso: string, range: LatencyRange): string {
  const date = parseISO(iso);
  switch (range) {
    case "24h":
      return format(date, "HH:mm");
    case "7d":
      return format(date, "MMM d HH:mm");
    case "30d":
      return format(date, "MMM d");
  }
}

export function formatDailyUptimeLabel(date: string): string {
  return format(parseISO(`${date}T00:00:00.000Z`), "MMM d");
}

export function formatDailyUptimeTooltip(date: string): string {
  return format(parseISO(`${date}T00:00:00.000Z`), "MMM d, yyyy");
}

/** Green ≥99%, amber 95–99%, red <95%, gray when no checks. */
export function uptimeBarLevel(percentage: number | null): UptimeBarLevel {
  if (percentage === null) return "empty";
  if (percentage >= 99) return "good";
  if (percentage >= 95) return "warn";
  return "bad";
}

export function hasLatencySeriesData(buckets: LatencyBucket[]): boolean {
  return buckets.some((bucket) => bucket.totalCount > 0);
}

export function hasDailyUptimeData(days: DailyUptime[]): boolean {
  return days.some((day) => day.totalCount > 0);
}

/**
 * Fill every expected bucket in the lookback window.
 * Missing buckets become `avgLatencyMs: null` so Recharts can show gaps (`connectNulls={false}`).
 */
export function toLatencyChartData(
  buckets: LatencyBucket[],
  range: LatencyRange,
  nowMs: number = Date.now(),
): LatencyChartPoint[] {
  const { bucketMs, lookbackMs } = getLatencyRangeConfig(range);
  const end = alignBucketStart(nowMs, bucketMs);
  const start = alignBucketStart(nowMs - lookbackMs, bucketMs);

  const byStart = new Map<number, LatencyBucket>();
  for (const bucket of buckets) {
    const key = alignBucketStart(Date.parse(bucket.bucketStart), bucketMs);
    if (Number.isNaN(key)) continue;
    byStart.set(key, bucket);
  }

  const points: LatencyChartPoint[] = [];
  for (let t = start; t <= end; t += bucketMs) {
    const existing = byStart.get(t);
    const bucketStart = new Date(t).toISOString();
    points.push({
      bucketStart,
      label: formatLatencyAxisLabel(bucketStart, range),
      avgLatencyMs: existing?.avgLatencyMs ?? null,
      okCount: existing?.okCount ?? 0,
      totalCount: existing?.totalCount ?? 0,
    });
  }
  return points;
}

/** Last 30 UTC calendar days (today inclusive), filling missing days with null %. */
export function toDailyUptimeChartData(
  days: DailyUptime[],
  nowMs: number = Date.now(),
): DailyUptimeChartPoint[] {
  const byDate = new Map(days.map((day) => [day.date.slice(0, 10), day]));
  const now = new Date(nowMs);
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const points: DailyUptimeChartPoint[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const dayMs = todayUtc - offset * 24 * 60 * 60_000;
    const date = new Date(dayMs).toISOString().slice(0, 10);
    const existing = byDate.get(date);
    const uptimePercentage = existing?.uptimePercentage ?? null;
    points.push({
      date,
      label: formatDailyUptimeLabel(date),
      uptimePercentage,
      okCount: existing?.okCount ?? 0,
      totalCount: existing?.totalCount ?? 0,
      level: uptimeBarLevel(uptimePercentage),
    });
  }
  return points;
}
