import type { z } from "zod";

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("\n");
}
