import type { InsForgeClient } from "@insforge/sdk"
import {
  asRecord,
  asRows,
  stringField,
  throwIfError,
} from "./insforge-data.js"
import { RESOURCE_KINDS, RESOURCE_TOOLS } from "./types.js"
import type {
  Resource,
  ResourceCreateInput,
  ResourceKind,
  ResourceTool,
  ResourceUpdateInput,
} from "./types.js"

const TABLE = "snippets"
const COLUMNS =
  "id,title,kind,content,language,tags,tool,custom_tool,version,context,created_at"

function isResourceKind(value: unknown): value is ResourceKind {
  return (
    typeof value === "string" &&
    (RESOURCE_KINDS as readonly string[]).includes(value)
  )
}

function isResourceTool(value: unknown): value is ResourceTool {
  return (
    typeof value === "string" &&
    (RESOURCE_TOOLS as readonly string[]).includes(value)
  )
}

function nullableString(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== "string") {
    throw new Error("Invalid resource row: expected nullable string field.")
  }
  return value
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error("Invalid resource row: tags must be a string array.")
  }
  return value
}

export function mapRowToResource(value: unknown): Resource {
  const row = asRecord(value, "resource row")
  const kind = row.kind
  if (!isResourceKind(kind)) {
    throw new Error(
      `Invalid resource row: kind must be one of ${RESOURCE_KINDS.join(", ")}.`,
    )
  }

  const tool = row.tool
  if (tool !== null && !isResourceTool(tool)) {
    throw new Error(
      `Invalid resource row: tool must be one of ${RESOURCE_TOOLS.join(", ")}.`,
    )
  }

  return {
    id: stringField(row, "id", "resource row"),
    title: stringField(row, "title", "resource row"),
    kind,
    content: stringField(row, "content", "resource row"),
    language: nullableString(row.language),
    tags: asTags(row.tags),
    tool,
    customTool: nullableString(row.custom_tool),
    version: nullableString(row.version),
    context: nullableString(row.context),
    createdAt: stringField(row, "created_at", "resource row"),
  }
}

function toResourcePayload(input: ResourceCreateInput) {
  return {
    title: input.title,
    kind: input.kind,
    content: input.content,
    language: input.language,
    tags: input.tags,
    tool: input.tool,
    custom_tool: input.customTool,
    version: input.version,
    context: input.context,
  }
}

export type ResourcesServiceDeps = { client: InsForgeClient }

export function createResourcesService({ client }: ResourcesServiceDeps) {
  async function get(id: string): Promise<Resource> {
    const response = await client.database
      .from(TABLE)
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle()
    throwIfError(response.error, "Failed to get resource.")
    const data: unknown = response.data
    if (data === null) throw new Error("Resource not found.")
    return mapRowToResource(data)
  }

  return {
    async list(): Promise<Resource[]> {
      const response = await client.database
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false })
      throwIfError(response.error, "Failed to list resources.")
      const data: unknown = response.data
      return asRows(data, "resource list").map(mapRowToResource)
    },

    get,

    async create(input: ResourceCreateInput): Promise<Resource> {
      const response = await client.database
        .from(TABLE)
        .insert([toResourcePayload(input)])
        .select(COLUMNS)
        .single()
      throwIfError(response.error, "Failed to create resource.")
      const data: unknown = response.data
      return mapRowToResource(data)
    },

    async update(id: string, input: ResourceUpdateInput): Promise<Resource> {
      const changes: Record<string, unknown> = {}
      if (input.title !== undefined) changes.title = input.title
      if (input.kind !== undefined) changes.kind = input.kind
      if (input.content !== undefined) changes.content = input.content
      if (input.language !== undefined) changes.language = input.language
      if (input.tags !== undefined) changes.tags = input.tags
      if (input.tool !== undefined) changes.tool = input.tool
      if (input.customTool !== undefined) changes.custom_tool = input.customTool
      if (input.version !== undefined) changes.version = input.version
      if (input.context !== undefined) changes.context = input.context
      if (Object.keys(changes).length === 0) {
        throw new Error("Nothing to update. Provide at least one field.")
      }

      await get(id)
      const response = await client.database
        .from(TABLE)
        .update(changes)
        .eq("id", id)
        .select(COLUMNS)
        .single()
      throwIfError(response.error, "Failed to update resource.")
      const data: unknown = response.data
      return mapRowToResource(data)
    },

    async delete(id: string): Promise<void> {
      await get(id)
      const response = await client.database.from(TABLE).delete().eq("id", id)
      throwIfError(response.error, "Failed to delete resource.")
    },
  }
}

export type ResourcesService = ReturnType<typeof createResourcesService>
