import { REVIEW_INBOX_EXCERPT_LENGTH, type ReviewInboxItem } from "../types/review-inbox";

export function reviewInboxExcerpt(body: string): string {
  const line = body.replace(/\s+/g, " ").trim();
  if (line.length <= REVIEW_INBOX_EXCERPT_LENGTH) return line;
  return `${line.slice(0, REVIEW_INBOX_EXCERPT_LENGTH - 1)}…`;
}

export function compareReviewInboxItems(left: ReviewInboxItem, right: ReviewInboxItem): number {
  const byMovedAt = left.lastMovedAt.localeCompare(right.lastMovedAt);
  if (byMovedAt !== 0) return byMovedAt;
  return left.ticketId.localeCompare(right.ticketId);
}

export function sortReviewInboxItems(items: ReviewInboxItem[]): ReviewInboxItem[] {
  return [...items].sort(compareReviewInboxItems);
}
