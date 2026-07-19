import {
  ID,
  Permission,
  Query,
  Role,
  type Models,
  type TablesDB,
} from "node-appwrite"
import { CATEGORIES } from "./types.js"
import type {
  Bookmark,
  BookmarkCreateInput,
  BookmarkUpdateInput,
  Category,
  ForgeConfig,
} from "./types.js"

type BookmarkRow = Models.DefaultRow & {
  title?: unknown
  url?: unknown
  category?: unknown
  description?: unknown
  tags?: unknown
  userId?: unknown
}

function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" &&
    (CATEGORIES as readonly string[]).includes(value)
  )
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid bookmark row: ${field} must be a string.`)
  }
  return value
}

function asTags(value: unknown): string[] {
  if (value == null) return []
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error("Invalid bookmark row: tags must be a string array.")
  }
  return value
}

export function mapRowToBookmark(row: BookmarkRow): Bookmark {
  const category = row.category
  if (!isCategory(category)) {
    throw new Error(
      `Invalid bookmark row: category must be one of ${CATEGORIES.join(", ")}.`,
    )
  }

  return {
    id: row.$id,
    title: asString(row.title, "title"),
    url: asString(row.url, "url"),
    category,
    description: asString(row.description, "description"),
    tags: asTags(row.tags),
    createdAt: row.$createdAt,
  }
}

function assertOwnedByUser(row: BookmarkRow, userId: string): void {
  if (row.userId !== userId) {
    throw new Error("Bookmark not found.")
  }
}

function formatAppwriteError(error: unknown, fallback: string): Error {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const code =
      "code" in error ? (error as { code: unknown }).code : undefined
    if (code === 404) {
      return new Error("Bookmark not found.")
    }
    return new Error((error as { message: string }).message)
  }
  return new Error(fallback)
}

export type BookmarksServiceDeps = {
  tablesDB: TablesDB
  config: ForgeConfig
  userId: string
}

export function createBookmarksService(deps: BookmarksServiceDeps) {
  const { tablesDB, config, userId } = deps
  const databaseId = config.databaseId
  const tableId = config.bookmarksTableId

  async function getOwnedRow(id: string): Promise<BookmarkRow> {
    try {
      const row = await tablesDB.getRow<BookmarkRow>({
        databaseId,
        tableId,
        rowId: id,
      })
      assertOwnedByUser(row, userId)
      return row
    } catch (error) {
      throw formatAppwriteError(error, "Failed to get bookmark.")
    }
  }

  return {
    async list(): Promise<Bookmark[]> {
      try {
        const response = await tablesDB.listRows<BookmarkRow>({
          databaseId,
          tableId,
          queries: [
            Query.equal("userId", userId),
            Query.orderDesc("$createdAt"),
          ],
        })
        return response.rows.map(mapRowToBookmark)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to list bookmarks.")
      }
    },

    async get(id: string): Promise<Bookmark> {
      const row = await getOwnedRow(id)
      return mapRowToBookmark(row)
    },

    async create(input: BookmarkCreateInput): Promise<Bookmark> {
      try {
        const row = await tablesDB.createRow<BookmarkRow>({
          databaseId,
          tableId,
          rowId: ID.unique(),
          data: {
            title: input.title,
            url: input.url,
            category: input.category,
            description: input.description,
            tags: input.tags,
            userId,
          },
          permissions: [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        })
        return mapRowToBookmark(row)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to create bookmark.")
      }
    },

    async update(id: string, input: BookmarkUpdateInput): Promise<Bookmark> {
      const data: Record<string, unknown> = {}
      if (input.title !== undefined) data.title = input.title
      if (input.url !== undefined) data.url = input.url
      if (input.category !== undefined) data.category = input.category
      if (input.description !== undefined) data.description = input.description
      if (input.tags !== undefined) data.tags = input.tags

      if (Object.keys(data).length === 0) {
        throw new Error("Nothing to update. Provide at least one field.")
      }

      await getOwnedRow(id)

      try {
        const row = await tablesDB.updateRow<BookmarkRow>({
          databaseId,
          tableId,
          rowId: id,
          data,
        })
        return mapRowToBookmark(row)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to update bookmark.")
      }
    },

    async delete(id: string): Promise<void> {
      await getOwnedRow(id)

      try {
        await tablesDB.deleteRow({
          databaseId,
          tableId,
          rowId: id,
        })
      } catch (error) {
        throw formatAppwriteError(error, "Failed to delete bookmark.")
      }
    },
  }
}

export type BookmarksService = ReturnType<typeof createBookmarksService>
