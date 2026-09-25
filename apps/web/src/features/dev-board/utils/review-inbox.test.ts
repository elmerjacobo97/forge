import { describe, expect, it } from "vitest";

import { REVIEW_INBOX_EXCERPT_LENGTH, type ReviewInboxItem } from "../types/review-inbox";
import { reviewInboxExcerpt, sortReviewInboxItems } from "./review-inbox";

function item(overrides: Partial<ReviewInboxItem> = {}): ReviewInboxItem {
  return {
    ticketId: "ticket-1",
    projectId: "project-1",
    projectName: "Forge",
    title: "Ship inbox",
    column: "review",
    prUrl: null,
    lastMovedAt: "2026-09-01T00:00:00.000Z",
    comment: null,
    ...overrides,
  };
}

describe("reviewInboxExcerpt", () => {
  it("collapses whitespace onto one line", () => {
    expect(reviewInboxExcerpt("  ready\n\nfor   review  ")).toBe("ready for review");
  });

  it("keeps text that already fits in 160 characters", () => {
    const body = "a".repeat(REVIEW_INBOX_EXCERPT_LENGTH);
    expect(reviewInboxExcerpt(body)).toBe(body);
  });

  it("cuts to 160 characters and ends with an ellipsis", () => {
    const excerpt = reviewInboxExcerpt("a".repeat(REVIEW_INBOX_EXCERPT_LENGTH + 1));
    expect(excerpt).toHaveLength(REVIEW_INBOX_EXCERPT_LENGTH);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});

describe("sortReviewInboxItems", () => {
  it("orders by lastMovedAt ascending, then ticketId", () => {
    const later = item({ ticketId: "ticket-2", lastMovedAt: "2026-09-03T00:00:00.000Z" });
    const earlierHighId = item({
      ticketId: "ticket-9",
      lastMovedAt: "2026-09-01T00:00:00.000Z",
    });
    const earlierLowId = item({
      ticketId: "ticket-1",
      lastMovedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(
      sortReviewInboxItems([later, earlierHighId, earlierLowId]).map((row) => row.ticketId),
    ).toEqual(["ticket-1", "ticket-9", "ticket-2"]);
  });
});
