import { cn } from "@/lib/utils";
import { UPTIME_STATUS_DOT_COLORS, UPTIME_STATUS_LABELS } from "../constants";
import type { MonitorStatus } from "../types";

export function MonitorStatusBadge({ status }: { status: MonitorStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={cn("size-2 rounded-full", UPTIME_STATUS_DOT_COLORS[status])} />
      {UPTIME_STATUS_LABELS[status]}
    </span>
  );
}
