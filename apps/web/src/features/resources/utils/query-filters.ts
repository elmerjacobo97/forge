import { escapeLikePattern, quotePostgrestValue } from "@/lib/postgrest";

export function buildResourceSearchFilter(query: string): string {
  const pattern = `%${escapeLikePattern(query)}%`;

  return [
    `title.ilike.${quotePostgrestValue(pattern)}`,
    `description.ilike.${quotePostgrestValue(pattern)}`,
    `tags.cs.{${quotePostgrestValue(query)}}`,
  ].join(",");
}
