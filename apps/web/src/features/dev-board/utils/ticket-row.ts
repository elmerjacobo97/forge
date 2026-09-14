import { z } from "zod";

import type { Ticket } from "../types/board";

export const TICKET_COLUMNS =
  "id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at,branch,pr_url";

export const ticketRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  description: z.string(),
  column_id: z.enum(["backlog", "todo", "in_progress", "validation", "review", "done"]),
  position: z.coerce.number(),
  priority: z.enum(["low", "med", "high"]),
  created_at: z.string(),
  timer_started_at: z.string().nullable(),
  total_elapsed_ms: z.coerce.number(),
  is_paused: z.boolean(),
  last_moved_at: z.string(),
  branch: z.string().nullable(),
  pr_url: z.string().nullable(),
});

export function toTicket(value: unknown): Ticket {
  const row = ticketRowSchema.parse(value);
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    column: row.column_id,
    position: row.position,
    priority: row.priority,
    createdAt: row.created_at,
    timerStartedAt: row.timer_started_at,
    totalElapsedMs: row.total_elapsed_ms,
    isPaused: row.is_paused,
    lastMovedAt: row.last_moved_at,
    branch: row.branch,
    prUrl: row.pr_url,
  };
}
