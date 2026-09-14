import { z } from "zod";
import { formatZodError } from "./bookmark-schema.js";
import { COLUMNS, COMMENT_AUTHORS, PRIORITIES } from "./types.js";
import type {
  TicketCommentInput,
  TicketCreateInput,
  TicketMoveInput,
  TicketReportInput,
  TicketTimeAdjustInput,
  TicketUpdateInput,
} from "./types.js";

const prioritySchema = z.enum(PRIORITIES, {
  error: `Priority must be one of: ${PRIORITIES.join(", ")}.`,
});

const columnSchema = z.enum(COLUMNS, {
  error: `Column must be one of: ${COLUMNS.join(", ")}.`,
});

const commentAuthorSchema = z.enum(COMMENT_AUTHORS, {
  error: `Author must be one of: ${COMMENT_AUTHORS.join(", ")}.`,
});

const projectIdSchema = z
  .string({ error: "Project id is required (--project-id)." })
  .trim()
  .min(1, "Project id is required (--project-id).");

const titleSchema = z
  .string({ error: "Title is required (--title)." })
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must be at most 120 characters.");

const descriptionSchema = z
  .string({ error: "Description must be a string (--description)." })
  .trim()
  .max(2000, "Description must be at most 2000 characters.");

const branchSchema = z
  .string({ error: "Branch must be a string (--branch)." })
  .trim()
  .min(1, "Branch must be at least 1 character.")
  .max(200, "Branch must be at most 200 characters.");

const prUrlSchema = z
  .string({ error: "PR URL must be a string (--pr-url)." })
  .trim()
  .max(2048, "PR URL must be at most 2048 characters.")
  .regex(/^https?:\/\//i, "PR URL must start with http:// or https://.");

const commentBodySchema = z
  .string({ error: "Comment body is required (--body)." })
  .trim()
  .min(1, "Comment body is required (--body).")
  .max(5000, "Comment body must be at most 5000 characters.");

export const ticketCreateSchema = z.object({
  projectId: projectIdSchema,
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  column: columnSchema,
});

export const ticketUpdateSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    priority: prioritySchema.optional(),
    branch: branchSchema.optional(),
    prUrl: prUrlSchema.optional(),
    clearBranch: z.boolean().optional(),
    clearPrUrl: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message:
      "Provide at least one field to update (--title, --description, --priority, --branch, or --pr-url).",
  });

export const ticketMoveSchema = z.object({
  id: z.string({ error: "Ticket id is required." }).trim().min(1, "Ticket id is required."),
  column: columnSchema,
  branch: branchSchema.optional(),
  prUrl: prUrlSchema.optional(),
  clearBranch: z.boolean().optional(),
  clearPrUrl: z.boolean().optional(),
});

export const ticketCommentSchema = z.object({
  body: commentBodySchema,
  author: commentAuthorSchema.default("user"),
});

const DURATION_PATTERN = /^(?:(\d+)h)?(?:(\d+)m)?$/i;

export function parseDurationMs(value: string): number | { error: string } {
  const match = value.trim().match(DURATION_PATTERN);
  if (!match || (match[1] === undefined && match[2] === undefined)) {
    return { error: "Duration must look like 1h30m or 90m." };
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const durationMs = (hours * 60 + minutes) * 60_000;
  if (!Number.isSafeInteger(durationMs)) {
    return { error: "Duration is too large." };
  }
  return durationMs;
}

const stopAtSchema = z
  .string({ error: "Stop time must be 'now' or an ISO 8601 timestamp (--stop-at)." })
  .trim()
  .refine((value) => value.toLowerCase() === "now" || !Number.isNaN(Date.parse(value)), {
    message: "Stop time must be 'now' or a valid ISO 8601 timestamp.",
  });

export const ticketTimeAdjustSchema = z
  .object({
    id: z.string({ error: "Ticket id is required." }).trim().min(1, "Ticket id is required."),
    set: z
      .string({ error: "Duration must be a string (--set)." })
      .trim()
      .min(1, "Duration must not be empty (--set).")
      .optional(),
    setTotal: z
      .string({ error: "Duration must be a string (--set-total)." })
      .trim()
      .min(1, "Duration must not be empty (--set-total).")
      .optional(),
    removeLast: z.boolean().optional(),
    stopAt: stopAtSchema.optional(),
  })
  .superRefine((value, context) => {
    const provided = [
      value.set !== undefined,
      value.setTotal !== undefined,
      value.removeLast === true,
      value.stopAt !== undefined,
    ].filter(Boolean).length;

    if (provided !== 1) {
      context.addIssue({
        code: "custom",
        message: "Provide exactly one of --set, --set-total, --remove-last or --stop-at.",
      });
      return;
    }

    const durationInput = value.set ?? value.setTotal;
    if (durationInput !== undefined) {
      const duration = parseDurationMs(durationInput);
      if (typeof duration !== "number") {
        context.addIssue({ code: "custom", message: duration.error });
      }
    }
  });

const reportDaysSchema = z.coerce
  .number({ error: "Days must be a number (--days)." })
  .int("Days must be an integer.")
  .min(1, "Days must be between 1 and 90.")
  .max(90, "Days must be between 1 and 90.");

const isoDateTimeSchema = z
  .string({ error: "Date must be an ISO 8601 string (--since/--until)." })
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Date must be a valid ISO 8601 timestamp.",
  });

export const ticketReportSchema = z
  .object({
    days: reportDaysSchema.default(7),
    since: isoDateTimeSchema.optional(),
    until: isoDateTimeSchema.optional(),
    projectId: z.string().trim().min(1, "Project id must not be empty.").optional(),
    columns: z.array(columnSchema).optional(),
  })
  .refine(
    (value) => !value.since || !value.until || Date.parse(value.since) < Date.parse(value.until),
    { message: "--since must be earlier than --until." },
  );

export function parseTicketCreateInput(value: unknown): TicketCreateInput | { error: string } {
  const parsed = ticketCreateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseTicketUpdateInput(value: unknown): TicketUpdateInput | { error: string } {
  const parsed = ticketUpdateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseTicketMoveInput(value: unknown): TicketMoveInput | { error: string } {
  const parsed = ticketMoveSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseTicketCommentInput(value: unknown): TicketCommentInput | { error: string } {
  const parsed = ticketCommentSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseTicketTimeAdjustInput(
  value: unknown,
): TicketTimeAdjustInput | { error: string } {
  const parsed = ticketTimeAdjustSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { id, set, setTotal, removeLast, stopAt } = parsed.data;

  if (set !== undefined) {
    const durationMs = parseDurationMs(set);
    if (typeof durationMs !== "number") {
      return { error: durationMs.error };
    }
    return { id, set: durationMs };
  }

  if (setTotal !== undefined) {
    const durationMs = parseDurationMs(setTotal);
    if (typeof durationMs !== "number") {
      return { error: durationMs.error };
    }
    return { id, setTotal: durationMs };
  }

  if (removeLast === true) {
    return { id, removeLast: true };
  }

  if (stopAt !== undefined) {
    return { id, stopAt: stopAt.toLowerCase() === "now" ? new Date().toISOString() : stopAt };
  }

  return { error: "Provide exactly one of --set, --set-total, --remove-last or --stop-at." };
}

export function parseTicketReportInput(value: unknown): TicketReportInput | { error: string } {
  const parsed = ticketReportSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseColumnId(value: unknown): (typeof COLUMNS)[number] | { error: string } {
  const parsed = columnSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parsePriority(value: unknown): (typeof PRIORITIES)[number] | { error: string } {
  const parsed = prioritySchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}
