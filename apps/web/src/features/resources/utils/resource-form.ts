import { FORMATS } from "../constants";

export function isSelectContentTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-slot="select-content"]') !== null;
}

export function toFormatValue(language: string | null): string {
  const value = language?.trim().toLowerCase() ?? "";
  return value && FORMATS.some((format) => format.value === value) ? value : value ? "other" : "";
}
