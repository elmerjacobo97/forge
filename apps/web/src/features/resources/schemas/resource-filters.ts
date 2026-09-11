import { z } from "zod";

const resourceKindSchema = z.enum(["note", "prompt", "config", "code"]);
const resourceToolSchema = z.enum([
  "react-native",
  "vscode",
  "cursor",
  "opencode",
  "claude-code",
  "other",
]);
const resourceFormatSchema = z.enum([
  "json",
  "yaml",
  "javascript",
  "typescript",
  "markdown",
  "env",
  "plain-text",
  "other",
]);

export const resourceFiltersSchema = z.object({
  q: z.string().trim(),
  kind: z.union([resourceKindSchema, z.literal("all")]),
  tool: z.union([resourceToolSchema, z.literal("all")]),
  format: z.union([resourceFormatSchema, z.literal("all")]),
  tag: z.string(),
});

export type ResourceFilters = z.infer<typeof resourceFiltersSchema>;

function param(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseResourceFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ResourceFilters {
  const parsed = resourceFiltersSchema.safeParse({
    q: param(searchParams, "q") ?? "",
    kind: param(searchParams, "kind") ?? "all",
    tool: param(searchParams, "tool") ?? "all",
    format: param(searchParams, "format") ?? "all",
    tag: param(searchParams, "tag") ?? "all",
  });

  return parsed.success
    ? parsed.data
    : { q: "", kind: "all", tool: "all", format: "all", tag: "all" };
}
