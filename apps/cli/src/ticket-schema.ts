import { z } from "zod"
import { formatZodError } from "./bookmark-schema.js"
import { COLUMNS, PRIORITIES } from "./types.js"
import type {
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

const titleSchema = z
  .string({ error: "Title is required (--title)." })
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must be at most 120 characters.")

const descriptionSchema = z
  .string({ error: "Description must be a string (--description)." })
  .trim()
  .max(2000, "Description must be at most 2000 characters.")

export const ticketCreateSchema = z.object({
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
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update (--title, --description, or --priority).",
  })

export const ticketMoveSchema = z.object({
  id: z
    .string({ error: "Ticket id is required." })
    .trim()
    .min(1, "Ticket id is required."),
  column: columnSchema,
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
