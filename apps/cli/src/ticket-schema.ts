import { z } from "zod"
import { formatZodError } from "./bookmark-schema.js"
import { COLUMNS, COMMENT_AUTHORS, PRIORITIES } from "./types.js"
import type {
  TicketCommentInput,
  TicketCreateInput,
  TicketMoveInput,
  TicketUpdateInput,
} from "./types.js"

const prioritySchema = z.enum(PRIORITIES, {
  error: `Priority must be one of: ${PRIORITIES.join(", ")}.`,
})

const columnSchema = z.enum(COLUMNS, {
  error: `Column must be one of: ${COLUMNS.join(", ")}.`,
})

const commentAuthorSchema = z.enum(COMMENT_AUTHORS, {
  error: `Author must be one of: ${COMMENT_AUTHORS.join(", ")}.`,
})

const projectIdSchema = z
  .string({ error: "Project id is required (--project-id)." })
  .trim()
  .min(1, "Project id is required (--project-id).")

const titleSchema = z
  .string({ error: "Title is required (--title)." })
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must be at most 120 characters.")

const descriptionSchema = z
  .string({ error: "Description must be a string (--description)." })
  .trim()
  .max(2000, "Description must be at most 2000 characters.")

const branchSchema = z
  .string({ error: "Branch must be a string (--branch)." })
  .trim()
  .min(1, "Branch must be at least 1 character.")
  .max(200, "Branch must be at most 200 characters.")

const prUrlSchema = z
  .string({ error: "PR URL must be a string (--pr-url)." })
  .trim()
  .max(2048, "PR URL must be at most 2048 characters.")
  .regex(/^https?:\/\//i, "PR URL must start with http:// or https://.")

const commentBodySchema = z
  .string({ error: "Comment body is required (--body)." })
  .trim()
  .min(1, "Comment body is required (--body).")
  .max(5000, "Comment body must be at most 5000 characters.")

export const ticketCreateSchema = z.object({
  projectId: projectIdSchema,
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  column: columnSchema,
})

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
  })

export const ticketMoveSchema = z.object({
  id: z
    .string({ error: "Ticket id is required." })
    .trim()
    .min(1, "Ticket id is required."),
  column: columnSchema,
  branch: branchSchema.optional(),
  prUrl: prUrlSchema.optional(),
  clearBranch: z.boolean().optional(),
  clearPrUrl: z.boolean().optional(),
})

export const ticketCommentSchema = z.object({
  body: commentBodySchema,
  author: commentAuthorSchema.default("user"),
})

export function parseTicketCreateInput(
  value: unknown,
): TicketCreateInput | { error: string } {
  const parsed = ticketCreateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseTicketUpdateInput(
  value: unknown,
): TicketUpdateInput | { error: string } {
  const parsed = ticketUpdateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseTicketMoveInput(
  value: unknown,
): TicketMoveInput | { error: string } {
  const parsed = ticketMoveSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseTicketCommentInput(
  value: unknown,
): TicketCommentInput | { error: string } {
  const parsed = ticketCommentSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseColumnId(
  value: unknown,
): (typeof COLUMNS)[number] | { error: string } {
  const parsed = columnSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parsePriority(
  value: unknown,
): (typeof PRIORITIES)[number] | { error: string } {
  const parsed = prioritySchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}
