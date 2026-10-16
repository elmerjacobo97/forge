import { z } from "zod";

export const NO_PROJECT = "none";

const titleSchema = z
  .string()
  .min(2, "Title must be at least 2 characters.")
  .max(200, "Title must be at most 200 characters.");

const contentSchema = z
  .string()
  .min(1, "Content is required.")
  .max(100000, "Content must be at most 100000 characters.");

export const noteSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  tagsString: z.string(),
  projectId: z.string(),
});

export type NoteSchema = z.infer<typeof noteSchema>;

export const noteInputSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  tags: z.array(z.string()),
  projectId: z.uuid("Project id must be a valid UUID.").nullable(),
});
