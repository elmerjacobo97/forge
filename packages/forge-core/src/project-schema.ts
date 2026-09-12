import { z } from "zod"
import { formatZodError } from "./bookmark-schema.js"
import type { ProjectCreateInput, ProjectUpdateInput } from "./types.js"

const nameSchema = z
  .string({ error: "Name is required (--name)." })
  .trim()
  .min(1, "Name is required.")
  .max(80, "Name must be at most 80 characters.")

const descriptionSchema = z
  .string({ error: "Description must be a string (--description)." })
  .trim()
  .max(2000, "Description must be at most 2000 characters.")

export const projectCreateSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
})

export const projectUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update (--name or --description).",
  })

export function parseProjectCreateInput(
  value: unknown,
): ProjectCreateInput | { error: string } {
  const parsed = projectCreateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseProjectUpdateInput(
  value: unknown,
): ProjectUpdateInput | { error: string } {
  const parsed = projectUpdateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}
