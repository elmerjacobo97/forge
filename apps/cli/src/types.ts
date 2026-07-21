export type ForgeConfig = {
  url: string
  anonKey: string
}

export type ForgeSession = {
  userId: string
  accessToken: string
  refreshToken: string
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

export type Project = {
  id: string
  name: string
  description: string
  createdAt: string
}

export type ProjectCreateInput = {
  name: string
  description: string
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>

export type Ticket = {
  id: string
  projectId: string
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
  projectId: string
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

export const RESOURCE_KINDS = [
  "note",
  "prompt",
  "config",
  "code",
] as const

export type ResourceKind = (typeof RESOURCE_KINDS)[number]

export const RESOURCE_TOOLS = [
  "react-native",
  "vscode",
  "cursor",
  "opencode",
  "claude-code",
  "other",
] as const

export type ResourceTool = (typeof RESOURCE_TOOLS)[number]

export type Resource = {
  id: string
  title: string
  kind: ResourceKind
  content: string
  language: string | null
  tags: string[]
  tool: ResourceTool | null
  customTool: string | null
  version: string | null
  context: string | null
  createdAt: string
}

export type ResourceCreateInput = {
  title: string
  kind: ResourceKind
  content: string
  language: string | null
  tags: string[]
  tool: ResourceTool | null
  customTool: string | null
  version: string | null
  context: string | null
}

export type ResourceUpdateInput = Partial<ResourceCreateInput>
