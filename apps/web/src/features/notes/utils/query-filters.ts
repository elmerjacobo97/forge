import { escapeLikePattern, quotePostgrestValue } from "@/lib/postgrest";

export function buildNoteSearchFilter(query: string): string {
  const pattern = `%${escapeLikePattern(query)}%`;

  return [
    `title.ilike.${quotePostgrestValue(pattern)}`,
    `content.ilike.${quotePostgrestValue(pattern)}`,
    `tags.cs.{${quotePostgrestValue(query.toLowerCase())}}`,
  ].join(",");
}
