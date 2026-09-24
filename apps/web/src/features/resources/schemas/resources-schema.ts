import { z } from "zod";

export const resourcesSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  url: z.url("Must be a valid URL."),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tagsString: z.string(),
});

export type ResourcesSchema = z.infer<typeof resourcesSchema>;

export const resourceInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  url: z.url("Must be a valid URL."),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tags: z.array(z.string()),
});

const resourceCategorySchema = z.enum(["docs", "git", "tool", "article", "other"]);

export const resourceFiltersSchema = z.object({
  q: z.string().trim(),
  category: z.union([resourceCategorySchema, z.literal("all")]),
});

export type ResourceFilters = z.infer<typeof resourceFiltersSchema>;

export function parseResourceFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ResourceFilters {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "all";

  const parsed = resourceFiltersSchema.safeParse({ q, category });
  return parsed.success ? parsed.data : { q: "", category: "all" };
}
