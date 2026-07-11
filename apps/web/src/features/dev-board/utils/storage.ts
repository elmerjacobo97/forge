import type { Ticket } from "../types";
import { STORAGE_KEY } from "../types";
import { nowISO } from "./timer";

function createSeedTickets(): Ticket[] {
  const now = nowISO();
  const eightMinAgo = new Date(Date.now() - 8 * 60 * 1000).toISOString();
  return [
    {
      id: "seed-1",
      title: "Fix login redirect loop",
      description: "OAuth callback redirects to /login infinitely when session expired.",
      column: "backlog",
      order: 0,
      priority: "high",
      createdAt: now,
      timerStartedAt: null,
      totalElapsedMs: 0,
      isPaused: false,
      history: [],
    },
    {
      id: "seed-2",
      title: "Add dark mode toggle to settings",
      description: "Use next-themes already installed. Persist preference.",
      column: "todo",
      order: 0,
      priority: "med",
      createdAt: now,
      timerStartedAt: null,
      totalElapsedMs: 0,
      isPaused: false,
      history: [],
    },
    {
      id: "seed-3",
      title: "Refactor hash command to streaming",
      description: "Stream large files instead of reading all into memory.",
      column: "in_progress",
      order: 0,
      priority: "med",
      createdAt: now,
      timerStartedAt: eightMinAgo,
      totalElapsedMs: 0,
      isPaused: false,
      history: [
        { at: now, from: "todo", to: "in_progress" },
      ],
    },
  ];
}

export function loadBoard(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedTickets();
      saveBoard(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as Ticket[];
    if (!Array.isArray(parsed)) return createSeedTickets();
    return parsed;
  } catch {
    return createSeedTickets();
  }
}

export function saveBoard(tickets: Ticket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // storage full or unavailable — silent fail
  }
}