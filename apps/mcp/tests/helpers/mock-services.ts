import { vi, type Mock } from "vitest";
import type { Note, Project, Resource, Ticket, TicketComment, TicketEvent } from "@forge/core";
import type { ForgeServices } from "../../src/services.js";

export interface MockServices {
  projects: { list: Mock; get: Mock; create: Mock; delete: Mock };
  board: {
    list: Mock;
    get: Mock;
    next: Mock;
    listComments: Mock;
    create: Mock;
    move: Mock;
    update: Mock;
    addComment: Mock;
    pauseTimer: Mock;
    resumeTimer: Mock;
    adjustTime: Mock;
    delete: Mock;
  };
  activity: { listEvents: Mock; listCommentsInRange: Mock };
  resources: { list: Mock; get: Mock; create: Mock; update: Mock; delete: Mock };
  notes: { list: Mock; get: Mock; create: Mock; update: Mock; delete: Mock };
  projectMap: {
    getMap: Mock;
    getFlow: Mock;
    upsertModule: Mock;
    upsertFlow: Mock;
    deleteModule: Mock;
    deleteFlow: Mock;
  };
}

export function createMockServices(): MockServices {
  return {
    projects: { list: vi.fn(), get: vi.fn(), create: vi.fn(), delete: vi.fn() },
    board: {
      delete: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      next: vi.fn(),
      listComments: vi.fn(),
      create: vi.fn(),
      move: vi.fn(),
      update: vi.fn(),
      addComment: vi.fn(),
      pauseTimer: vi.fn(),
      resumeTimer: vi.fn(),
      adjustTime: vi.fn(),
    },
    activity: { listEvents: vi.fn(), listCommentsInRange: vi.fn() },
    resources: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    notes: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectMap: {
      getMap: vi.fn(),
      getFlow: vi.fn(),
      upsertModule: vi.fn(),
      upsertFlow: vi.fn(),
      deleteModule: vi.fn(),
      deleteFlow: vi.fn(),
    },
  };
}

export function asForgeServices(services: MockServices): ForgeServices {
  return services as unknown as ForgeServices;
}

export function project(id: string, name = id): Project {
  return { id, name, description: "", createdAt: "2026-09-01T00:00:00.000Z" };
}

export function ticket(id: string, overrides: Partial<Ticket> = {}): Ticket {
  return {
    id,
    projectId: "p1",
    title: id,
    description: "description",
    column: "todo",
    position: 0,
    priority: "med",
    createdAt: "2026-09-01T00:00:00.000Z",
    timerStartedAt: null,
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: "2026-09-01T00:00:00.000Z",
    branch: null,
    prUrl: null,
    responsibleName: null,
    startDate: null,
    dueDate: null,
    complexity: null,
    ...overrides,
  };
}

export function comment(id: string, ticketId: string, createdAt: string): TicketComment {
  return { id, ticketId, author: "agent", body: `comment ${id}`, createdAt };
}

export function resource(id: string, overrides: Partial<Resource> = {}): Resource {
  return {
    id,
    title: id,
    url: "https://example.com",
    category: "docs",
    description: "description",
    tags: [],
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

export function note(id: string, overrides: Partial<Note> = {}): Note {
  return {
    id,
    title: id,
    content: "content",
    tags: [],
    projectId: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

export function event(id: string, ticketId: string, occurredAt: string): TicketEvent {
  return {
    id,
    ticketId,
    eventType: "moved",
    fromColumn: "todo",
    toColumn: "in_progress",
    occurredAt,
  };
}
