import { z } from "zod";

import { COLUMNS, PRIORITIES } from "../types/board";

export const ticketSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").max(2000),
  priority: z.enum(PRIORITIES),
  branch: z
    .string()
    .max(200, "Branch is too long")
    .transform((value) => value.trim() || null)
    .nullable(),
  prUrl: z
    .string()
    .max(2048, "PR URL is too long")
    .refine(
      (value) => value.trim() === "" || /^https?:\/\//i.test(value.trim()),
      "PR URL must start with http:// or https://",
    )
    .transform((value) => value.trim() || null)
    .nullable(),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

export const ticketCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment is required").max(5000, "Comment is too long"),
});

export type TicketCommentFormValues = z.infer<typeof ticketCommentSchema>;

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
  branch: z.string().min(1, "Branch is required").max(200, "Branch is too long").nullable(),
  prUrl: z
    .string()
    .max(2048, "PR URL is too long")
    .regex(/^https?:\/\//i, "PR URL must start with http:// or https://")
    .nullable(),
});

export type TicketInput = z.infer<typeof ticketInputSchema>;

export const ticketTimeAdjustSchema = z.discriminatedUnion("action", [
  z.object({
    ticketId: z.uuid(),
    action: z.literal("stop_at"),
    endedAt: z.iso.datetime(),
  }),
  z.object({
    ticketId: z.uuid(),
    action: z.literal("set_last_duration"),
    durationMs: z.number().int().min(0),
  }),
  z.object({
    ticketId: z.uuid(),
    action: z.literal("delete_last"),
  }),
  z.object({
    ticketId: z.uuid(),
    action: z.literal("set_total"),
    durationMs: z.number().int().min(0),
  }),
]);

export type TicketTimeAdjustInput = z.infer<typeof ticketTimeAdjustSchema>;

export const ticketTimeFormSchema = z.object({
  hours: z.number().int().min(0),
  minutes: z.number().int().min(0),
});

export type TicketTimeFormValues = z.infer<typeof ticketTimeFormSchema>;
