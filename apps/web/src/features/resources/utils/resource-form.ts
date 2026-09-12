import { FORMATS } from "../constants";

export function toFormatValue(language: string | null): string {
  const value = language?.trim().toLowerCase() ?? "";
  return value && FORMATS.some((format) => format.value === value) ? value : value ? "other" : "";
}
