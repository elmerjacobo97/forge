import { escapeLikePattern, quotePostgrestValue } from "@/lib/postgrest";
import { FORMATS } from "../constants";

const KNOWN_FORMAT_VALUES = FORMATS.map((format) => format.value).filter(
  (value) => value !== "other",
);

export function buildResourceSearchFilter(query: string): string {
  const pattern = `%${escapeLikePattern(query)}%`;

  return [
    `title.ilike.${quotePostgrestValue(pattern)}`,
    `content.ilike.${quotePostgrestValue(pattern)}`,
    `tags.cs.{${quotePostgrestValue(query)}}`,
  ].join(",");
}

export function buildOtherFormatFilter(): string {
  const known = KNOWN_FORMAT_VALUES.map((value) => `"${value}"`).join(",");

  return `language.eq.other,language.not.in.(${known})`;
}
