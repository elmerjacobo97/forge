// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types/board";
import { checkStaleTickets } from "./stale-alert";

const NOW = Date.parse("2026-09-12T12:00:00.000Z");
const TWENTY_FIVE_MINUTES = 25 * 60_000;

interface SentNotification {
  title: string;
  body?: string;
}

const sent: SentNotification[] = [];

function startedAgo(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
    projectId: "project-1",
    title: "Timer ticket",
    description: "",
    column: "in_progress",
    position: 0,
    priority: "med",
    createdAt: startedAgo(TWENTY_FIVE_MINUTES),
    timerStartedAt: startedAgo(TWENTY_FIVE_MINUTES + 60_000),
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: startedAgo(3 * 3_600_000),
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

afterEach(() => {
  sent.length = 0;
  vi.unstubAllGlobals();
});

function stubNotifications(permission: NotificationPermission = "granted") {
  class FakeNotification {
    static permission = permission;
    title: string;
    body?: string;

    constructor(title: string, options?: { body?: string }) {
      this.title = title;
      this.body = options?.body;
      sent.push({ title, body: options?.body });
    }
  }

  vi.stubGlobal("Notification", FakeNotification);
}

describe("checkStaleTickets", () => {
  it("does not alert after a resume even when lastMovedAt is old", () => {
    stubNotifications();
    const alerted = new Set<string>();
    const ticket = makeTicket({ timerStartedAt: startedAgo(5 * 60_000) });

    const changed = checkStaleTickets([ticket], alerted, NOW);

    expect(changed).toBe(false);
    expect(alerted.size).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("alerts once for the running session and ignores an old lastMovedAt", () => {
    stubNotifications();
    const alerted = new Set<string>();
    const ticket = makeTicket({
      timerStartedAt: startedAgo(TWENTY_FIVE_MINUTES + 60_000),
      lastMovedAt: startedAgo(3 * 3_600_000),
    });

    expect(checkStaleTickets([ticket], alerted, NOW)).toBe(true);
    expect(checkStaleTickets([ticket], alerted, NOW)).toBe(false);
    expect(alerted.has(ticket.id)).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.body).toContain("26:00");
  });

  it("clears the alert once the timer is paused or stopped", () => {
    stubNotifications("denied");
    const alerted = new Set(["ticket-1"]);
    const ticket = makeTicket({ isPaused: true, timerStartedAt: null });

    expect(checkStaleTickets([ticket], alerted, NOW)).toBe(true);
    expect(alerted.size).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("does not alert before the threshold", () => {
    stubNotifications();
    const alerted = new Set<string>();
    const ticket = makeTicket({ timerStartedAt: startedAgo(10 * 60_000) });

    expect(checkStaleTickets([ticket], alerted, NOW)).toBe(false);
    expect(sent).toHaveLength(0);
  });
});
