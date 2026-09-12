import { z } from "zod"
import { CATEGORIES } from "./types.js"
import type { BookmarkCreateInput, BookmarkUpdateInput } from "./types.js"

const categorySchema = z.enum(CATEGORIES, {
  error: `Category must be one of: ${CATEGORIES.join(", ")}.`,
})

export const bookmarkCreateSchema = z.object({
  title: z
    .string({ error: "Title is required (--title)." })
    .min(2, "Title must be at least 2 characters."),
  url: z
    .string({ error: "URL is required (--url)." })
    .url("Must be a valid URL."),
  category: categorySchema,
  description: z
    .string({ error: "Description is required (--description)." })
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tags: z.array(z.string()),
})

export const bookmarkUpdateSchema = bookmarkCreateSchema
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  })

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("\n")
}

export function parseBookmarkCreateInput(
  value: unknown,
): BookmarkCreateInput | { error: string } {
  const parsed = bookmarkCreateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseBookmarkUpdateInput(
  value: unknown,
): BookmarkUpdateInput | { error: string } {
  const parsed = bookmarkUpdateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}
