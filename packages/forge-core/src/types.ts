export type ForgeConfig = {
  url: string;
  anonKey: string;
};

export type ForgeSession = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

export const CATEGORIES = ["docs", "git", "tool", "article", "other"] as const;

export type Category = (typeof CATEGORIES)[number];

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  category: Category;
  description: string;
  tags: string[];
  createdAt: string;
};

export type BookmarkCreateInput = {
  title: string;
  url: string;
  category: Category;
  description: string;
  tags: string[];
};

export type BookmarkUpdateInput = Partial<BookmarkCreateInput>;

export const COLUMNS = ["backlog", "todo", "in_progress", "validation", "review", "done"] as const;

export type ColumnId = (typeof COLUMNS)[number];

/** Columns where the ticket timer runs (mirrors move_dev_board_ticket RPC). */
export const TIMER_COLUMNS = ["in_progress", "validation"] as const;

export function isTimerColumn(column: ColumnId): boolean {
  return (TIMER_COLUMNS as readonly string[]).includes(column);
}

export const PRIORITIES = ["low", "med", "high"] as const;

export type Priority = (typeof PRIORITIES)[number];

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type ProjectCreateInput = {
  name: string;
  description: string;
};

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export type Ticket = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  column: ColumnId;
  position: number;
  priority: Priority;
  createdAt: string;
  timerStartedAt: string | null;
  totalElapsedMs: number;
  isPaused: boolean;
  lastMovedAt: string;
  branch: string | null;
  prUrl: string | null;
};

export type TicketCreateInput = {
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  column: ColumnId;
};

export type TicketUpdateInput = Partial<
  Pick<TicketCreateInput, "title" | "description" | "priority">
> & {
  branch?: string;
  prUrl?: string;
  clearBranch?: boolean;
  clearPrUrl?: boolean;
};

export type TicketMoveInput = {
  id: string;
  column: ColumnId;
  branch?: string;
  prUrl?: string;
  clearBranch?: boolean;
  clearPrUrl?: boolean;
};

export const COMMENT_AUTHORS = ["user", "agent"] as const;

export type CommentAuthor = (typeof COMMENT_AUTHORS)[number];

export interface TicketComment {
  id: string;
  ticketId: string;
  author: CommentAuthor;
  body: string;
  createdAt: string;
}

export type TicketCommentInput = {
  body: string;
  author: CommentAuthor;
};

export interface NextTicketContext {
  ticket: Ticket | null;
  project: { id: string; name: string } | null;
  comments: TicketComment[];
  inProgress: Array<{
    ticket: Ticket;
    project: { id: string; name: string } | null;
  }>;
}

export const EVENT_TYPES = [
  "created",
  "moved",
  "started",
  "completed",
  "paused",
  "resumed",
] as const;

export type TicketEventType = (typeof EVENT_TYPES)[number];

export type TicketEvent = {
  id: string;
  ticketId: string;
  eventType: TicketEventType;
  fromColumn: ColumnId | null;
  toColumn: ColumnId | null;
  occurredAt: string;
};

export type ActivityTicket = {
  ticket: Ticket;
  project: { id: string; name: string } | null;
  events: TicketEvent[];
  comments: TicketComment[];
};

export type ActivityReport = {
  from: string;
  to: string;
  days: number;
  tickets: ActivityTicket[];
};

export type TicketReportInput = {
  days: number;
  since?: string;
  until?: string;
  projectId?: string;
  columns?: ColumnId[];
};

export const RESOURCE_KINDS = ["note", "prompt", "config", "code"] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const RESOURCE_TOOLS = [
  "react-native",
  "vscode",
  "cursor",
  "opencode",
  "claude-code",
  "other",
] as const;

export type ResourceTool = (typeof RESOURCE_TOOLS)[number];

export type Resource = {
  id: string;
  title: string;
  kind: ResourceKind;
  content: string;
  language: string | null;
  tags: string[];
  tool: ResourceTool | null;
  customTool: string | null;
  version: string | null;
  context: string | null;
  createdAt: string;
};

export type ResourceCreateInput = {
  title: string;
  kind: ResourceKind;
  content: string;
  language: string | null;
  tags: string[];
  tool: ResourceTool | null;
  customTool: string | null;
  version: string | null;
  context: string | null;
};

export type ResourceUpdateInput = Partial<ResourceCreateInput>;

export type ListOptions = {
  limit?: number;
  offset?: number;
};
