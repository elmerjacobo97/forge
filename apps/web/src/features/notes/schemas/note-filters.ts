import { z } from "zod";

export const noteFiltersSchema = z.object({
  q: z.string().trim(),
  tag: z.string(),
  project: z.union([z.uuid(), z.literal("all")]),
});

export type NoteFilters = z.infer<typeof noteFiltersSchema>;

const DEFAULT_FILTERS: NoteFilters = { q: "", tag: "all", project: "all" };

function param(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseNoteFilters(
  searchParams: Record<string, string | string[] | undefined>,
): NoteFilters {
  const parsed = noteFiltersSchema.safeParse({
    q: param(searchParams, "q") ?? DEFAULT_FILTERS.q,
    tag: param(searchParams, "tag") ?? DEFAULT_FILTERS.tag,
    project: param(searchParams, "project") ?? DEFAULT_FILTERS.project,
  });

  return parsed.success ? parsed.data : DEFAULT_FILTERS;
}
