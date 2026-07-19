export type ForgeConfig = {
  endpoint: string
  projectId: string
  databaseId: string
  bookmarksTableId: string
}

export type ForgeSession = {
  userId: string
  /** Appwrite session secret (from login cookie / X-Appwrite-Session). */
  sessionSecret: string
}

export type Category = "docs" | "git" | "tool" | "article" | "other"

export const CATEGORIES: readonly Category[] = [
  "docs",
  "git",
  "tool",
  "article",
  "other",
] as const

export type Bookmark = {
  id: string
  title: string
  url: string
  category: Category
  description: string
  tags: string[]
  createdAt: string
}

export type BookmarkCreateInput = {
  title: string
  url: string
  category: Category
  description: string
  tags: string[]
}

export type BookmarkUpdateInput = Partial<BookmarkCreateInput>
