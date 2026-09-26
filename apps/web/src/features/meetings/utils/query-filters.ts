import { escapeLikePattern, quotePostgrestValue } from "@/lib/postgrest";

export function buildMeetingSearchFilter(query: string): string {
  const pattern = quotePostgrestValue(`%${escapeLikePattern(query)}%`);
  return [`title.ilike.${pattern}`, `context.ilike.${pattern}`].join(",");
}
