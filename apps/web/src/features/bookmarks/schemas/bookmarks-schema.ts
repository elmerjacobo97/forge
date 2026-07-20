import { z } from "zod";

export const bookmarksSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  url: z.url("Must be a valid URL."),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tagsString: z.string(),
});

export type BookmarksSchema = z.infer<typeof bookmarksSchema>;
