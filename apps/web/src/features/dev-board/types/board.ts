export const COLUMNS = ["backlog", "todo", "in_progress", "validation", "review", "done"] as const;

export type ColumnId = (typeof COLUMNS)[number];

export const COLUMN_LABELS: Record<ColumnId, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  validation: "Validation",
  review: "Review",
  done: "Done",
};

/** Columns where the ticket timer runs (see move_dev_board_ticket RPC). */
export const TIMER_COLUMNS = ["in_progress", "validation"] as const;

export function isTimerColumn(column: ColumnId): boolean {
  return (TIMER_COLUMNS as readonly string[]).includes(column);
}

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
  branch: string | null;
  prUrl: string | null;
  commentCount?: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: "user" | "agent";
  body: string;
  createdAt: string;
}

export const STALE_THRESHOLD_MS = 25 * 60 * 1000;
export const STALE_SESSION_THRESHOLD_MS = 2 * 60 * 60 * 1000;
export const TICKETS_PAGE_SIZE = 25;

export interface ColumnPage {
  column: ColumnId;
  tickets: Ticket[];
  total: number;
  nextCursor: string | null;
}
