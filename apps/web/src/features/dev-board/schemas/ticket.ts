import { z } from "zod";

import { COLUMNS, PRIORITIES } from "../types/board";

export const ticketSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").max(2000),
  priority: z.enum(PRIORITIES),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

export const ticketCreateSchema = ticketSchema.extend({
  projectId: z.uuid(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketInputSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  title: z.string().min(1).max(120),
  description: z.string().max(2000),
  column: z.enum(COLUMNS),
  position: z.number(),
  priority: z.enum(PRIORITIES),
  createdAt: z.string(),
  timerStartedAt: z.string().nullable(),
  totalElapsedMs: z.number(),
  isPaused: z.boolean(),
  lastMovedAt: z.string(),
});

export type TicketInput = z.infer<typeof ticketInputSchema>;
