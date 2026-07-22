import { format, parseISO } from "date-fns";

import type { AnalyticsRange } from "../types/analytics";

export function formatRangeLabel(range: AnalyticsRange): string {
  const formatDay = (value: string) => format(parseISO(value), "MMM d, yyyy");
  return `${formatDay(range.from)} – ${formatDay(range.to)}`;
}

export function downloadCsv(content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dev-board-${format(new Date(), "yyyy-MM-dd")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
