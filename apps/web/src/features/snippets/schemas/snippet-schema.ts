import { z } from "zod";

export const snippetSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  kind: z.enum(["note", "prompt", "config", "snippet"]),
  content: z.string().min(1, "Content is required."),
  language: z.string(),
  tagsString: z.string(),
});

export type SnippetSchema = z.infer<typeof snippetSchema>;
