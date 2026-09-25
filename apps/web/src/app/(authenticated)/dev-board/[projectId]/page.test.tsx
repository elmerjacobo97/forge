import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  getProject: vi.fn(),
  fetchTicketPage: vi.fn(),
  getTicket: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));
vi.mock("@/features/auth/server", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/features/dev-board/components/project-board", () => ({
  ProjectBoard: () => null,
}));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { getProject: mocks.getProject },
}));
vi.mock("@/features/dev-board/services/dev-board-service", () => ({
  devBoardService: { fetchTicketPage: mocks.fetchTicketPage, getTicket: mocks.getTicket },
}));

import type { Ticket } from "@/features/dev-board/types/board";
import type { Project } from "@/features/dev-board/types/project";
import DevBoardProjectPage from "./page";

const project: Project = {
  id: "project-1",
  name: "Forge",
  description: "Dev tools",
  status: "paused",
  createdAt: "2026-09-23T00:00:00.000Z",
};

const projectTicketId = "424964d8-28d7-47cf-81ee-6714c5df47b9";
const otherProjectTicketId = "7a72077d-7cc8-4bb5-b33c-04f595f65750";

function ticket(id: string, projectId: string): Ticket {
  return {
    id,
    projectId,
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
}

function renderPage(ticketParam?: string) {
  return DevBoardProjectPage({
    params: Promise.resolve({ projectId: project.id }),
    searchParams: Promise.resolve(ticketParam === undefined ? {} : { ticket: ticketParam }),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("DevBoardProjectPage status", () => {
  it("passes the persisted project status through to the board", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchTicketPage.mockResolvedValue({ tickets: [], total: 0, nextCursor: null });

    const element = await renderPage();

    expect(element.props.project).toEqual(project);
    expect(element.props.project.status).toBe("paused");
    expect(element.props.initialTicket).toBeNull();
  });
});

describe("DevBoardProjectPage ticket query", () => {
  it("passes null when the ticket belongs to another project", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchTicketPage.mockResolvedValue({ tickets: [], total: 0, nextCursor: null });
    mocks.getTicket.mockResolvedValue(ticket(otherProjectTicketId, "project-2"));

    const element = await renderPage(otherProjectTicketId);

    expect(element.props.initialTicket).toBeNull();
  });

  it("passes null when the ticket does not exist", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchTicketPage.mockResolvedValue({ tickets: [], total: 0, nextCursor: null });
    mocks.getTicket.mockResolvedValue(null);

    const element = await renderPage(projectTicketId);

    expect(element.props.initialTicket).toBeNull();
  });

  it("passes null and skips the ticket lookup for an invalid id", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchTicketPage.mockResolvedValue({ tickets: [], total: 0, nextCursor: null });

    const element = await renderPage("not-a-uuid");

    expect(mocks.getTicket).not.toHaveBeenCalled();
    expect(element.props.initialTicket).toBeNull();
  });

  it("passes the ticket when the UUID belongs to the project", async () => {
    const opened = ticket(projectTicketId, project.id);
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchTicketPage.mockResolvedValue({ tickets: [], total: 0, nextCursor: null });
    mocks.getTicket.mockResolvedValue(opened);

    const element = await renderPage(projectTicketId);

    expect(element.props.initialTicket).toEqual(opened);
  });
});
