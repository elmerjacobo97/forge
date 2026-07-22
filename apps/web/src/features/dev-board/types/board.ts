export const COLUMNS = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
] as const;

export type ColumnId = (typeof COLUMNS)[number];

export const COLUMN_LABELS: Record<ColumnId, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITIES = ["low", "med", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  med: "Medium",
  high: "High",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-sky-500",
  med: "bg-amber-500",
  high: "bg-rose-500",
};

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description: string;
  column: ColumnId;
  position: number;
  priority: Priority;
  createdAt: string;
  timerStartedAt: string | null;
  totalElapsedMs: number;
  isPaused: boolean;
  lastMovedAt: string;
}

export const STALE_THRESHOLD_MS = 25 * 60 * 1000;
export const TICKETS_PAGE_SIZE = 25;
