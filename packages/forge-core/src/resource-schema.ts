import { z } from "zod";
import { formatZodError } from "./schema-utils.js";
import { RESOURCE_CATEGORIES } from "./types.js";
import type { ResourceCreateInput, ResourceUpdateInput } from "./types.js";

const categorySchema = z.enum(RESOURCE_CATEGORIES, {
  error: `Category must be one of: ${RESOURCE_CATEGORIES.join(", ")}.`,
});

export const resourceCreateSchema = z.object({
  title: z
    .string({ error: "Title is required (--title)." })
    .min(2, "Title must be at least 2 characters."),
  url: z.string({ error: "URL is required (--url)." }).url("Must be a valid URL."),
  category: categorySchema,
  description: z
    .string({ error: "Description is required (--description)." })
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tags: z.array(z.string()),
});

export const resourceUpdateSchema = resourceCreateSchema
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  });

export function parseResourceCreateInput(value: unknown): ResourceCreateInput | { error: string } {
  const parsed = resourceCreateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseResourceUpdateInput(value: unknown): ResourceUpdateInput | { error: string } {
  const parsed = resourceUpdateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}
