import { z } from "zod";
import { formatZodError } from "./schema-utils.js";
import { IDEA_CATEGORIES, IDEA_STATUSES } from "./types.js";
import type { IdeaCreateInput, IdeaUpdateInput } from "./types.js";

const statusSchema = z.enum(IDEA_STATUSES, {
  error: `Status must be one of: ${IDEA_STATUSES.join(", ")}.`,
});

const categorySchema = z.enum(IDEA_CATEGORIES, {
  error: `Category must be one of: ${IDEA_CATEGORIES.join(", ")}.`,
});

function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
  return Array.from(new Set(normalized));
}

function normalizeLinks(links: string[]): string[] {
  return Array.from(new Set(links));
}

const tagsSchema = z
  .array(z.string({ error: "Tags must be an array of strings." }))
  .default([])
  .transform(normalizeTags);

const linksSchema = z
  .array(
    z
      .string({ error: "Links must be an array of strings." })
      .trim()
      .min(1, "Links cannot be empty.")
      .url("Links must be valid URLs."),
  )
  .max(10, "Links must be at most 10.")
  .default([])
  .transform(normalizeLinks);

export const ideaCreateSchema = z.object({
  title: z
    .string({ error: "Title is required (--title)." })
    .min(2, "Title must be at least 2 characters."),
  content: z.string({ error: "Content is required (--content)." }).min(1, "Content is required."),
  status: statusSchema.default("seed"),
  category: categorySchema.default("other"),
  tags: tagsSchema,
  links: linksSchema,
});

export const ideaUpdateSchema = z
  .object({
    title: z
      .string({ error: "Title is required (--title)." })
      .min(2, "Title must be at least 2 characters.")
      .optional(),
    content: z
      .string({ error: "Content is required (--content)." })
      .min(1, "Content is required.")
      .optional(),
    status: statusSchema.optional(),
    category: categorySchema.optional(),
    tags: z
      .array(z.string({ error: "Tags must be an array of strings." }))
      .transform(normalizeTags)
      .optional(),
    links: z
      .array(
        z
          .string({ error: "Links must be an array of strings." })
          .trim()
          .min(1, "Links cannot be empty.")
          .url("Links must be valid URLs."),
      )
      .max(10, "Links must be at most 10.")
      .transform(normalizeLinks)
      .optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  });

export function parseIdeaCreateInput(value: unknown): IdeaCreateInput | { error: string } {
  const parsed = ideaCreateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseIdeaUpdateInput(value: unknown): IdeaUpdateInput | { error: string } {
  const parsed = ideaUpdateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}
