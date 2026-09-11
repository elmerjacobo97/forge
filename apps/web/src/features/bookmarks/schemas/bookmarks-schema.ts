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

export const bookmarkInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  url: z.url("Must be a valid URL."),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tags: z.array(z.string()),
});

const bookmarkCategorySchema = z.enum(["docs", "git", "tool", "article", "other"]);

export const bookmarkFiltersSchema = z.object({
  q: z.string().trim(),
  category: z.union([bookmarkCategorySchema, z.literal("all")]),
});

export type BookmarkFilters = z.infer<typeof bookmarkFiltersSchema>;

export function parseBookmarkFilters(
  searchParams: Record<string, string | string[] | undefined>,
): BookmarkFilters {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "all";

  const parsed = bookmarkFiltersSchema.safeParse({ q, category });
  return parsed.success ? parsed.data : { q: "", category: "all" };
}
