import { describe, expect, it } from "vitest";

import type { DailyUptime, LatencyBucket } from "../types";
import {
  formatLatencyAxisLabel,
  getLatencyRangeConfig,
  hasLatencySeriesData,
  toDailyUptimeChartData,
  toLatencyChartData,
  uptimeBarLevel,
} from "./chart-data";

describe("chart-data", () => {
  it("maps latency ranges to bucket sizes", () => {
    expect(getLatencyRangeConfig("24h")).toEqual({
      bucketMs: 30 * 60_000,
      lookbackMs: 24 * 60 * 60_000,
    });
    expect(getLatencyRangeConfig("7d").bucketMs).toBe(3 * 60 * 60_000);
    expect(getLatencyRangeConfig("30d").bucketMs).toBe(24 * 60 * 60_000);
  });

  it("fills latency gaps with null instead of 0", () => {
    const nowMs = Date.parse("2026-07-22T12:00:00.000Z");
    const buckets: LatencyBucket[] = [
      {
        bucketStart: "2026-07-22T11:00:00.000Z",
        avgLatencyMs: 120,
        okCount: 2,
        totalCount: 2,
      },
    ];

    const points = toLatencyChartData(buckets, "24h", nowMs);
    expect(points.length).toBe(49);

    const withData = points.find((p) => p.bucketStart === "2026-07-22T11:00:00.000Z");
    expect(withData).toMatchObject({ avgLatencyMs: 120, totalCount: 2 });

    const gap = points.find((p) => p.bucketStart === "2026-07-22T11:30:00.000Z");
    expect(gap).toMatchObject({ avgLatencyMs: null, totalCount: 0 });
  });

  it("detects empty latency series", () => {
    expect(hasLatencySeriesData([])).toBe(false);
    expect(
      hasLatencySeriesData([
        { bucketStart: "2026-07-22T11:00:00.000Z", avgLatencyMs: null, okCount: 0, totalCount: 0 },
      ]),
    ).toBe(false);
    expect(
      hasLatencySeriesData([
        { bucketStart: "2026-07-22T11:00:00.000Z", avgLatencyMs: 10, okCount: 1, totalCount: 1 },
      ]),
    ).toBe(true);
  });

  it("fills 30 UTC days and classifies bar levels", () => {
    const nowMs = Date.parse("2026-07-22T15:00:00.000Z");
    const days: DailyUptime[] = [
      { date: "2026-07-22", uptimePercentage: 100, okCount: 10, totalCount: 10 },
      { date: "2026-07-21", uptimePercentage: 97, okCount: 97, totalCount: 100 },
      { date: "2026-07-20", uptimePercentage: 90, okCount: 9, totalCount: 10 },
    ];

    const points = toDailyUptimeChartData(days, nowMs);
    expect(points).toHaveLength(30);
    expect(points[0]?.date).toBe("2026-06-23");
    expect(points[29]?.date).toBe("2026-07-22");
    expect(points[29]).toMatchObject({ level: "good", uptimePercentage: 100 });
    expect(points[28]).toMatchObject({ level: "warn", uptimePercentage: 97 });
    expect(points[27]).toMatchObject({ level: "bad", uptimePercentage: 90 });
    expect(points[26]).toMatchObject({ level: "empty", uptimePercentage: null });
  });

  it("classifies uptime bar levels at boundaries", () => {
    expect(uptimeBarLevel(null)).toBe("empty");
    expect(uptimeBarLevel(99)).toBe("good");
    expect(uptimeBarLevel(98.9)).toBe("warn");
    expect(uptimeBarLevel(95)).toBe("warn");
    expect(uptimeBarLevel(94.9)).toBe("bad");
  });

  it("formats axis labels by range", () => {
    const iso = "2026-07-22T14:30:00.000Z";
    expect(formatLatencyAxisLabel(iso, "24h")).toMatch(/\d{2}:\d{2}/);
    expect(formatLatencyAxisLabel(iso, "30d")).toMatch(/Jul/);
  });
});
