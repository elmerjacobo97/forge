import type { InsForgeClient } from "@insforge/sdk"
import {
  asRecord,
  asRows,
  stringField,
  throwIfError,
} from "./insforge-data.js"
import { CATEGORIES } from "./types.js"
import type {
  Bookmark,
  BookmarkCreateInput,
  BookmarkUpdateInput,
  Category,
} from "./types.js"

const TABLE = "bookmarks"
const COLUMNS = "id,title,url,category,description,tags,created_at"

function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" &&
    (CATEGORIES as readonly string[]).includes(value)
  )
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error("Invalid bookmark row: tags must be a string array.")
  }
  return value
}

export function mapRowToBookmark(value: unknown): Bookmark {
  const row = asRecord(value, "bookmark row")
  const category = row.category
  if (!isCategory(category)) {
    throw new Error(
      `Invalid bookmark row: category must be one of ${CATEGORIES.join(", ")}.`,
    )
  }

  return {
    id: stringField(row, "id", "bookmark row"),
    title: stringField(row, "title", "bookmark row"),
    url: stringField(row, "url", "bookmark row"),
    category,
    description: stringField(row, "description", "bookmark row"),
    tags: asTags(row.tags),
    createdAt: stringField(row, "created_at", "bookmark row"),
  }
}

export type BookmarksServiceDeps = { client: InsForgeClient }

export function createBookmarksService({ client }: BookmarksServiceDeps) {
  async function get(id: string): Promise<Bookmark> {
    const response = await client.database
      .from(TABLE)
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle()
    throwIfError(response.error, "Failed to get bookmark.")
    const data: unknown = response.data
    if (data === null) throw new Error("Bookmark not found.")
    return mapRowToBookmark(data)
  }

  return {
    async list(): Promise<Bookmark[]> {
      const response = await client.database
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false })
      throwIfError(response.error, "Failed to list bookmarks.")
      const data: unknown = response.data
      return asRows(data, "bookmark list").map(mapRowToBookmark)
    },

    get,

    async create(input: BookmarkCreateInput): Promise<Bookmark> {
      const response = await client.database
        .from(TABLE)
        .insert([
          {
            title: input.title,
            url: input.url,
            category: input.category,
            description: input.description,
            tags: input.tags,
          },
        ])
        .select(COLUMNS)
        .single()
      throwIfError(response.error, "Failed to create bookmark.")
      const data: unknown = response.data
      return mapRowToBookmark(data)
    },

    async update(id: string, input: BookmarkUpdateInput): Promise<Bookmark> {
      const changes: Record<string, unknown> = {}
      if (input.title !== undefined) changes.title = input.title
      if (input.url !== undefined) changes.url = input.url
      if (input.category !== undefined) changes.category = input.category
      if (input.description !== undefined) changes.description = input.description
      if (input.tags !== undefined) changes.tags = input.tags
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
      throwIfError(response.error, "Failed to update bookmark.")
      const data: unknown = response.data
      return mapRowToBookmark(data)
    },

    async delete(id: string): Promise<void> {
      await get(id)
      const response = await client.database.from(TABLE).delete().eq("id", id)
      throwIfError(response.error, "Failed to delete bookmark.")
    },
  }
}

export type BookmarksService = ReturnType<typeof createBookmarksService>
