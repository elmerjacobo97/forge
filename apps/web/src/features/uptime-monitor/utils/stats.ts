import type { UptimeCheck } from "../types";

/** Percentage of `ok` checks in the given window, or null when there's no data yet. */
export function computeUptimePercentage(checks: UptimeCheck[]): number | null {
  if (checks.length === 0) return null;
  const okCount = checks.filter((check) => check.ok).length;
  return (okCount / checks.length) * 100;
}

export function formatLatency(latencyMs: number): string {
  return `${latencyMs}ms`;
}

export function formatUptimePercentage(percentage: number | null): string {
  if (percentage === null) return "—";
  return `${percentage.toFixed(percentage === 100 ? 0 : 1)}%`;
}

/** Duration between two ISO timestamps, or "Ongoing" when `endedAt` is null. */
export function formatIncidentDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "Ongoing";
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
