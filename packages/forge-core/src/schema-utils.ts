import type { z } from "zod";

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("\n");
}

export function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
  return Array.from(new Set(normalized));
}
