import type { AnalyticsRange } from "../types/analytics";

export function toDateInput(value: string): string {
  return value.slice(0, 10);
}

export function toRange(from: string, to: string): AnalyticsRange {
  return {
    from: new Date(`${from}T00:00:00`).toISOString(),
    to: new Date(`${to}T23:59:59.999`).toISOString(),
  };
}

export function formatRangeLabel(range: AnalyticsRange): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${format(range.from)} – ${format(range.to)}`;
}

export function downloadCsv(content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dev-board-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
