import { z } from "zod";
import { formatZodError, normalizeTags } from "./schema-utils.js";
import type { NoteCreateInput, NoteUpdateInput } from "./types.js";

const titleSchema = z
  .string({ error: "Title is required (--title)." })
  .min(2, "Title must be at least 2 characters.")
  .max(200, "Title must be at most 200 characters.");

const contentSchema = z
  .string({ error: "Content is required (--content)." })
  .min(1, "Content is required.")
  .max(100000, "Content must be at most 100000 characters.");

const tagsSchema = z.array(z.string({ error: "Tags must be an array of strings." }));

const projectIdSchema = z.uuid("Project id must be a valid UUID.").nullable();

export const noteCreateSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  tags: tagsSchema.default([]).transform(normalizeTags),
  projectId: projectIdSchema.optional(),
});

export const noteUpdateSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    tags: tagsSchema.transform(normalizeTags).optional(),
    projectId: projectIdSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  });

export function parseNoteCreateInput(value: unknown): NoteCreateInput | { error: string } {
  const parsed = noteCreateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}

export function parseNoteUpdateInput(value: unknown): NoteUpdateInput | { error: string } {
  const parsed = noteUpdateSchema.safeParse(value);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  return parsed.data;
}
