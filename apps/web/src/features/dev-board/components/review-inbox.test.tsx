// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getTicketAction: vi.fn(),
  updateTicketAction: vi.fn(),
}));
vi.mock("../actions", () => ({
  getTicketAction: mocks.getTicketAction,
  updateTicketAction: mocks.updateTicketAction,
}));
vi.mock("./ticket-form", () => ({
  TicketForm: ({ open, editTicket }: { open: boolean; editTicket: { title: string } | null }) =>
    open && editTicket ? <div>{`Edit ${editTicket.title}`}</div> : null,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import type { Ticket } from "../types/board";
import type { ReviewInboxItem } from "../types/review-inbox";
import { ReviewInbox } from "./review-inbox";

const withPr: ReviewInboxItem = {
  ticketId: "ticket-1",
  projectId: "project-1",
  projectName: "Forge",
  title: "Ship inbox",
  column: "review",
  prUrl: "https://github.com/acme/forge/pull/24",
  lastMovedAt: "2026-09-01T00:00:00.000Z",
  comment: { author: "agent", excerpt: "Ready for review" },
};

const withoutPrOrComment: ReviewInboxItem = {
  ticketId: "ticket-2",
  projectId: "project-2",
  projectName: "Notes",
  title: "Check validation",
  column: "validation",
  prUrl: null,
  lastMovedAt: "2026-09-02T00:00:00.000Z",
  comment: null,
};

const openedTicket: Ticket = {
  id: "ticket-1",
  projectId: "project-1",
  title: "Ship inbox",
  description: "Open it here",
  column: "review",
  position: 0,
  priority: "med",
  createdAt: "2026-09-01T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 0,
  isPaused: false,
  lastMovedAt: "2026-09-01T00:00:00.000Z",
  branch: null,
  prUrl: "https://github.com/acme/forge/pull/24",
};

beforeEach(() => vi.clearAllMocks());

describe("ReviewInbox", () => {
  it("shows a PR link and the latest comment on a review row", () => {
    render(<ReviewInbox items={[withPr]} />);

    expect(screen.getByRole("link", { name: "Projects" }).getAttribute("href")).toBe("/dev-board");
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeTruthy();
    expect(screen.getByText("Tickets waiting in validation or review.")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Project" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Title" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Column" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "PR" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Comment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ship inbox" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ship inbox" })).toBeNull();
    expect(screen.getByRole("link", { name: "Forge" }).getAttribute("href")).toBe(
      "/dev-board/project-1",
    );
    expect(screen.getByText("Review")).toBeTruthy();
    const pr = screen.getByRole("link", { name: "PR" });
    expect(pr.getAttribute("href")).toBe("https://github.com/acme/forge/pull/24");
    expect(pr.getAttribute("target")).toBe("_blank");
    expect(screen.getByText("agent")).toBeTruthy();
    expect(screen.getByText("Ready for review").className).toContain("line-clamp-2");
    expect(screen.queryByText("branch")).toBeNull();
  });

  it("leaves the PR and comment cells empty when both are missing", () => {
    render(<ReviewInbox items={[withoutPrOrComment]} />);

    expect(screen.getByRole("button", { name: "Check validation" })).toBeTruthy();
    expect(screen.getByText("Validation")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "PR" })).toBeNull();
    expect(screen.queryByText("you")).toBeNull();
    expect(screen.queryByText("agent")).toBeNull();
  });

  it("shows a user comment as you", () => {
    render(
      <ReviewInbox items={[{ ...withPr, comment: { author: "user", excerpt: "Looks good" } }]} />,
    );

    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.getByText("Looks good")).toBeTruthy();
  });

  it("opens a detail dialog and keeps editing behind an Edit action", async () => {
    mocks.getTicketAction.mockResolvedValue({ ok: true, data: openedTicket });
    render(<ReviewInbox items={[withPr]} />);

    fireEvent.click(screen.getByRole("button", { name: "Ship inbox" }));

    expect(await screen.findByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(await screen.findByText("Open it here")).toBeTruthy();
    expect(screen.queryByText("Edit Ship inbox")).toBeNull();
    expect(mocks.getTicketAction).toHaveBeenCalledWith("ticket-1");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByText("Edit Ship inbox")).toBeTruthy();
  });

  it("says the inbox is empty when nothing is waiting", () => {
    render(<ReviewInbox items={[]} />);

    expect(screen.getByText("Nothing waiting in validation or review.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
