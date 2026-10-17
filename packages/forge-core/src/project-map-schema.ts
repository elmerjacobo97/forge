import { z } from "zod";
import { formatZodError } from "./schema-utils.js";
import type { ProjectFlowUpsertInput, ProjectModuleUpsertInput } from "./types.js";

export const FLOW_STEP_KINDS = [
  "page",
  "ui",
  "action",
  "service",
  "db",
  "command",
  "tool",
] as const;

export const slugSchema = z
  .string({ error: "Slug is required." })
  .max(60, "Slug must be at most 60 characters.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens.");

const relativeFileSchema = z
  .string()
  .min(1)
  .refine((file) => !file.startsWith("/") && !/^[a-zA-Z]:[\\/]/.test(file), {
    message: "File must be relative to the repo, not absolute.",
  });

export const flowStepSchema = z.object({
  kind: z.enum(FLOW_STEP_KINDS, {
    error: `Step kind must be one of: ${FLOW_STEP_KINDS.join(", ")}.`,
  }),
  label: z.string({ error: "Step label is required." }).min(1, "Step label is required."),
  symbol: z.string().optional(),
  file: relativeFileSchema.optional(),
  line: z.number().int().positive("Step line must be a positive integer.").optional(),
  input: z.string().optional(),
  output: z.string().optional(),
  inferred: z.boolean().default(false),
});

export const projectModuleUpsertSchema = z.object({
  slug: slugSchema,
  name: z
    .string({ error: "Name is required." })
    .min(1, "Name is required.")
    .max(120, "Name must be at most 120 characters."),
  description: z.string().max(2000, "Description must be at most 2000 characters.").default(""),
  dependsOn: z.array(slugSchema).default([]),
});

export const projectFlowUpsertSchema = z.object({
  moduleSlug: slugSchema,
  slug: slugSchema,
  title: z
    .string({ error: "Title is required." })
    .min(1, "Title is required.")
    .max(200, "Title must be at most 200 characters."),
  summary: z.string().max(2000, "Summary must be at most 2000 characters.").default(""),
  steps: z
    .array(flowStepSchema, { error: "Steps must be an array." })
    .min(1, "A flow needs at least 1 step.")
    .max(20, "A flow allows at most 20 steps."),
  commit: z.string().max(40, "Commit must be at most 40 characters.").nullable().default(null),
});

export function parseProjectModuleUpsertInput(
  value: unknown,
): ProjectModuleUpsertInput | { error: string } {
  const parsed = projectModuleUpsertSchema.safeParse(value);
  return parsed.success ? parsed.data : { error: formatZodError(parsed.error) };
}

export function parseProjectFlowUpsertInput(
  value: unknown,
): ProjectFlowUpsertInput | { error: string } {
  const parsed = projectFlowUpsertSchema.safeParse(value);
  return parsed.success ? parsed.data : { error: formatZodError(parsed.error) };
}
