import type { AnalyticsRange } from "../types/analytics";

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
