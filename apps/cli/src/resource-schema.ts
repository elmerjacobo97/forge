import { z } from "zod"
import { RESOURCE_KINDS, RESOURCE_TOOLS } from "./types.js"
import type { ResourceCreateInput, ResourceUpdateInput } from "./types.js"

const kindSchema = z.enum(RESOURCE_KINDS, {
  error: `Kind must be one of: ${RESOURCE_KINDS.join(", ")}.`,
})

const toolSchema = z.enum(RESOURCE_TOOLS, {
  error: `Tool must be one of: ${RESOURCE_TOOLS.join(", ")}.`,
})

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function optionalTool(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function addConfigIssues(
  value: {
    kind?: ResourceCreateInput["kind"]
    tool?: ResourceCreateInput["tool"] | null
    customTool?: string | null
  },
  context: z.RefinementCtx,
  requireTool: boolean,
): void {
  if (requireTool && value.kind === "config" && !value.tool) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tool"],
      message: "Tool is required for configurations (--tool).",
    })
  }

  if (value.tool === "other" && !value.customTool?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customTool"],
      message: "Custom tool name is required when selecting other (--custom-tool).",
    })
  }
}

function normalizeResourceFields(
  value: ResourceCreateInput,
): ResourceCreateInput {
  const isConfig = value.kind === "config"
  const tool = isConfig ? value.tool : null
  return {
    title: value.title,
    kind: value.kind,
    content: value.content,
    language: value.language,
    tags: value.tags,
    tool,
    customTool:
      isConfig && tool === "other" ? value.customTool?.trim() || null : null,
    version: isConfig ? value.version : null,
    context: isConfig ? value.context : null,
  }
}

const resourceBaseSchema = z.object({
  title: z
    .string({ error: "Title is required (--title)." })
    .min(2, "Title must be at least 2 characters."),
  kind: kindSchema,
  content: z
    .string({ error: "Content is required (--content)." })
    .min(1, "Content is required."),
  language: z.preprocess(optionalText, z.string().nullable()),
  tags: z.array(z.string()),
  tool: z.preprocess(optionalTool, toolSchema.nullable().optional()),
  customTool: z.preprocess(optionalText, z.string().nullable().optional()),
  version: z.preprocess(optionalText, z.string().nullable().optional()),
  context: z.preprocess(optionalText, z.string().nullable().optional()),
})

export const resourceCreateSchema = resourceBaseSchema
  .transform((value) => ({
    title: value.title,
    kind: value.kind,
    content: value.content,
    language: value.language ?? null,
    tags: value.tags,
    tool: value.tool ?? null,
    customTool: value.customTool ?? null,
    version: value.version ?? null,
    context: value.context ?? null,
  }))
  .superRefine((value, context) => {
    addConfigIssues(value, context, true)
  })
  .transform(normalizeResourceFields)

export const resourceUpdateSchema = resourceBaseSchema
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  })
  .superRefine((value, context) => {
    addConfigIssues(
      {
        kind: value.kind,
        tool: value.tool ?? undefined,
        customTool: value.customTool ?? undefined,
      },
      context,
      value.kind === "config",
    )
  })
  .transform((value) => {
    const normalized: ResourceUpdateInput = {}
    if (value.title !== undefined) normalized.title = value.title
    if (value.kind !== undefined) normalized.kind = value.kind
    if (value.content !== undefined) normalized.content = value.content
    if (value.language !== undefined) normalized.language = value.language ?? null
    if (value.tags !== undefined) normalized.tags = value.tags
    if (value.tool !== undefined) normalized.tool = value.tool ?? null
    if (value.customTool !== undefined) {
      normalized.customTool = value.customTool ?? null
    }
    if (value.version !== undefined) normalized.version = value.version ?? null
    if (value.context !== undefined) normalized.context = value.context ?? null

    if (normalized.kind !== undefined && normalized.kind !== "config") {
      normalized.tool = null
      normalized.customTool = null
      normalized.version = null
      normalized.context = null
    } else if (normalized.kind === "config" || normalized.tool !== undefined) {
      const tool = normalized.tool
      if (tool !== "other") normalized.customTool = null
    }

    return normalized
  })

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("\n")
}

export function parseResourceCreateInput(
  value: unknown,
): ResourceCreateInput | { error: string } {
  const parsed = resourceCreateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}

export function parseResourceUpdateInput(
  value: unknown,
): ResourceUpdateInput | { error: string } {
  const parsed = resourceUpdateSchema.safeParse(value)
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) }
  }
  return parsed.data
}
