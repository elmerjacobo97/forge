import { z } from "zod";

const ideaStatusSchema = z.enum(["seed", "exploring", "building", "parked", "shipped"]);
const ideaCategorySchema = z.enum(["app", "web", "mobile", "business", "other"]);

export const ideaFiltersSchema = z.object({
  q: z.string().trim(),
  status: z.union([ideaStatusSchema, z.literal("all")]),
  category: z.union([ideaCategorySchema, z.literal("all")]),
  tag: z.string(),
});

export type IdeaFilters = z.infer<typeof ideaFiltersSchema>;

function param(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseIdeaFilters(
  searchParams: Record<string, string | string[] | undefined>,
): IdeaFilters {
  const parsed = ideaFiltersSchema.safeParse({
    q: param(searchParams, "q") ?? "",
    status: param(searchParams, "status") ?? "all",
    category: param(searchParams, "category") ?? "all",
    tag: param(searchParams, "tag") ?? "all",
  });

  return parsed.success ? parsed.data : { q: "", status: "all", category: "all", tag: "all" };
}
