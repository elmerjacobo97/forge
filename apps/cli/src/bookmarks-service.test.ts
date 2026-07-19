import { describe, expect, it } from "vitest"
import { mapRowToBookmark } from "./bookmarks-service.js"

describe("mapRowToBookmark", () => {
  it("maps a valid Appwrite row", () => {
    expect(
      mapRowToBookmark({
        $id: "row1",
        $createdAt: "2026-01-01T00:00:00.000Z",
        $updatedAt: "2026-01-01T00:00:00.000Z",
        $permissions: [],
        $sequence: 1,
        $tableId: "bookmarks",
        $databaseId: "db",
        title: "React docs",
        url: "https://react.dev",
        category: "docs",
        description: "Official React documentation",
        tags: ["react"],
        userId: "user1",
      }),
    ).toEqual({
      id: "row1",
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      tags: ["react"],
      createdAt: "2026-01-01T00:00:00.000Z",
    })
  })

  it("defaults missing tags to an empty array", () => {
    const bookmark = mapRowToBookmark({
      $id: "row1",
      $createdAt: "2026-01-01T00:00:00.000Z",
      $updatedAt: "2026-01-01T00:00:00.000Z",
      $permissions: [],
      $sequence: 1,
      $tableId: "bookmarks",
      $databaseId: "db",
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      userId: "user1",
    })
    expect(bookmark.tags).toEqual([])
  })

  it("rejects an unknown category", () => {
    expect(() =>
      mapRowToBookmark({
        $id: "row1",
        $createdAt: "2026-01-01T00:00:00.000Z",
        $updatedAt: "2026-01-01T00:00:00.000Z",
        $permissions: [],
        $sequence: 1,
        $tableId: "bookmarks",
        $databaseId: "db",
        title: "React docs",
        url: "https://react.dev",
        category: "invalid",
        description: "Official React documentation",
        tags: [],
        userId: "user1",
      }),
    ).toThrow(/category must be one of/)
  })
})
