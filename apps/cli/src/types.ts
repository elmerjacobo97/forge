export type ForgeConfig = {
  endpoint: string
  projectId: string
  databaseId: string
  bookmarksTableId: string
  devBoardProjectsTableId: string
  devBoardTicketsTableId: string
  devBoardEventsTableId: string
  devBoardTimeEntriesTableId: string
}

export type ForgeSession = {
  userId: string
  /** Appwrite session secret (from login cookie / X-Appwrite-Session). */
  sessionSecret: string
}

export const CATEGORIES = ["docs", "git", "tool", "article", "other"] as const

export type Category = (typeof CATEGORIES)[number]

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

export const COLUMNS = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
] as const

export type ColumnId = (typeof COLUMNS)[number]

export const PRIORITIES = ["low", "med", "high"] as const

export type Priority = (typeof PRIORITIES)[number]

export type Ticket = {
  id: string
  title: string
  description: string
  column: ColumnId
  position: number
  priority: Priority
  createdAt: string
  timerStartedAt: string | null
  totalElapsedMs: number
  isPaused: boolean
  lastMovedAt: string
}

export type TicketCreateInput = {
  title: string
  description: string
  priority: Priority
  column: ColumnId
}

export type TicketUpdateInput = Partial<
  Pick<TicketCreateInput, "title" | "description" | "priority">
>

export type TicketMoveInput = {
  id: string
  column: ColumnId
}
