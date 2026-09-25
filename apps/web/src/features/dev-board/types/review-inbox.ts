export const REVIEW_INBOX_COLUMNS = ["validation", "review"] as const;
export type ReviewInboxColumn = (typeof REVIEW_INBOX_COLUMNS)[number];

export const REVIEW_INBOX_EXCERPT_LENGTH = 160;

export interface ReviewInboxComment {
  author: "user" | "agent";
  excerpt: string;
}

export interface ReviewInboxItem {
  ticketId: string;
  projectId: string;
  projectName: string;
  title: string;
  column: ReviewInboxColumn;
  prUrl: string | null;
  lastMovedAt: string;
  comment: ReviewInboxComment | null;
}
