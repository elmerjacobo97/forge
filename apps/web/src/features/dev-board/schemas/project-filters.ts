import { z } from "zod";

import { PROJECT_STATUSES } from "../types/project";

const PROJECT_FILTER_STATUSES = ["all", ...PROJECT_STATUSES] as const;
export const PROJECT_SORTS = ["status", "name", "created"] as const;

export const projectFiltersSchema = z.object({
  q: z.string().trim().catch(""),
  status: z.enum(PROJECT_FILTER_STATUSES).catch("all"),
  sort: z.enum(PROJECT_SORTS).catch("status"),
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

export function parseProjectFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProjectFilters {
  return projectFiltersSchema.parse({
    q: searchParams.q ?? "",
    status: searchParams.status ?? "all",
    sort: searchParams.sort ?? "status",
  });
}
