import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("../actions", () => ({
  createTicketAction: vi.fn(),
  deleteTicketAction: vi.fn(),
  updateTicketAction: vi.fn(),
}));
vi.mock("../hooks/use-board-realtime", () => ({ useBoardRealtime: vi.fn() }));
vi.mock("./column-view", () => ({ ColumnView: () => null }));
vi.mock("./stale-move-prompt", () => ({ StaleMovePrompt: () => null }));
vi.mock("./ticket-comments-dialog", () => ({ TicketCommentsDialog: () => null }));
vi.mock("./ticket-drag-overlay", () => ({ TicketDragOverlay: () => null }));
vi.mock("./ticket-form", () => ({
  TicketForm: ({ open, editTicket }: { open: boolean; editTicket: { title: string } | null }) =>
    open && editTicket ? <div>{`Edit ${editTicket.title}`}</div> : null,
}));
vi.mock("./ticket-time-dialog", () => ({ TicketTimeDialog: () => null }));

import { COLUMNS, type Ticket } from "../types/board";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "../types/project";
import type { Project, ProjectStatus } from "../types/project";
import type { ColumnPage } from "../types/board";
import { ProjectBoard } from "./project-board";

const initialColumns: ColumnPage[] = COLUMNS.map((column) => ({
  column,
  tickets: [],
  total: 0,
  nextCursor: null,
}));

function renderBoard(status: ProjectStatus, initialTicket: Ticket | null = null): string {
  const project: Project = {
    id: "project-1",
    name: "Forge",
    description: "Dev tools",
    status,
    createdAt: "2026-09-23T00:00:00.000Z",
  };

  return renderToString(
    <ProjectBoard
      project={project}
      userId="user-1"
      initialColumns={initialColumns}
      initialTicket={initialTicket}
    />,
  );
}

const openedTicket: Ticket = {
  id: "424964d8-28d7-47cf-81ee-6714c5df47b9",
  projectId: "project-1",
  title: "Ship inbox",
  description: "",
  column: "review",
  position: 0,
  priority: "med",
  createdAt: "2026-09-01T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 0,
  isPaused: false,
  lastMovedAt: "2026-09-01T00:00:00.000Z",
  branch: null,
  prUrl: null,
};

describe("ProjectBoard opened ticket", () => {
  it("stays closed when the page passes null for another project's ticket", () => {
    expect(renderBoard("in_progress", null)).not.toContain("Edit Ship inbox");
  });

  it("stays closed when the page passes null for an invalid id", () => {
    expect(renderBoard("in_progress", null)).not.toContain("Edit Ship inbox");
  });

  it("opens the edit dialog for a ticket that belongs to the project", () => {
    expect(renderBoard("in_progress", openedTicket)).toContain("Edit Ship inbox");
  });
});

describe("ProjectBoard status badge", () => {
  it.each(PROJECT_STATUSES)("shows the current %s status", (status) => {
    const markup = renderBoard(status);

    expect(markup).toContain(`aria-label="Project status: ${PROJECT_STATUS_LABELS[status]}"`);
    expect(markup).toContain(PROJECT_STATUS_LABELS[status]);
  });
});
