import { z } from "zod";

import { COLUMNS, COMPLEXITY_LEVELS, PRIORITIES } from "../types/board";

const planningDateValueSchema = z.union([
  z.iso.datetime({ offset: true }),
  z.literal(""),
  z.null(),
]);
const planningDateSchema = planningDateValueSchema.transform((value) =>
  value === "" ? null : value,
);
const optionalPlanningDateSchema = planningDateValueSchema
  .optional()
  .transform((value) => (value === "" ? null : (value ?? null)));

const planningComplexitySchema = z
  .enum(COMPLEXITY_LEVELS)
  .nullable()
  .transform((value) => value ?? null);
const optionalPlanningComplexitySchema = z
  .enum(COMPLEXITY_LEVELS)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const ticketFormFields = {
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
  responsibleName: z
    .string()
    .trim()
    .max(120, "Responsible name must be at most 120 characters")
    .transform((value) => value || null),
  startDate: planningDateSchema,
  dueDate: planningDateSchema,
  complexity: planningComplexitySchema,
};

export const ticketSchema = z.object(ticketFormFields).superRefine((value, context) => {
  if (value.startDate && value.dueDate && Date.parse(value.startDate) > Date.parse(value.dueDate)) {
    context.addIssue({
      code: "custom",
      path: ["dueDate"],
      message: "Start Date must be on or before Due Date.",
    });
  }
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

export const ticketCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment is required").max(5000, "Comment is too long"),
});

export type TicketCommentFormValues = z.infer<typeof ticketCommentSchema>;

export const ticketCreateSchema = z
  .object({
    ...ticketFormFields,
    startDate: optionalPlanningDateSchema,
    dueDate: optionalPlanningDateSchema,
    complexity: optionalPlanningComplexitySchema,
    projectId: z.uuid(),
  })
  .superRefine((value, context) => {
    if (
      value.startDate &&
      value.dueDate &&
      Date.parse(value.startDate) > Date.parse(value.dueDate)
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Start Date must be on or before Due Date.",
      });
    }
  });

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketInputSchema = z
  .object({
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
    responsibleName: z.string().max(120).nullable(),
    startDate: z.iso.datetime({ offset: true }).nullable().optional(),
    dueDate: z.iso.datetime({ offset: true }).nullable().optional(),
    complexity: z.enum(COMPLEXITY_LEVELS).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.startDate &&
      value.dueDate &&
      Date.parse(value.startDate) > Date.parse(value.dueDate)
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Start Date must be on or before Due Date.",
      });
    }
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
    action: z.literal("stop_with_duration"),
    durationMs: z.number().int().min(1),
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
