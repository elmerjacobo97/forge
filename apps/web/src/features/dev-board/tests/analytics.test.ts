import { describe, expect, it } from "vitest";

import type { AnalyticsData, AnalyticsRange } from "../types/analytics";
import { analyticsCsv, buildAnalytics } from "../utils/analytics";

const range: AnalyticsRange = {
  from: "2026-07-01T00:00:00.000Z",
  to: "2026-07-31T23:59:59.999Z",
};

const data: AnalyticsData = {
  tickets: [{
    id: "ticket-1", projectId: "project-1", title: "Ship analytics", description: "", column: "done", position: 0,
    priority: "high", createdAt: "2026-07-01T00:00:00.000Z", timerStartedAt: null,
    totalElapsedMs: 3_600_000, isPaused: false, lastMovedAt: "2026-07-03T12:00:00.000Z",
  }],
  events: [
    { id: "start", ticketId: "ticket-1", eventType: "started", fromColumn: "todo", toColumn: "in_progress", occurredAt: "2026-07-02T10:00:00.000Z" },
    { id: "done", ticketId: "ticket-1", eventType: "completed", fromColumn: "in_progress", toColumn: "done", occurredAt: "2026-07-03T12:00:00.000Z" },
  ],
  timeEntries: [{ id: "entry-1", ticketId: "ticket-1", startedAt: "2026-07-02T10:00:00.000Z", endedAt: "2026-07-02T11:00:00.000Z", durationMs: 3_600_000 }],
};

describe("buildAnalytics", () => {
  it("aggregates completed work, cycle time, and logged time", () => {
    const summary = buildAnalytics(data, range);

    expect(summary.completed).toBe(1);
    expect(summary.loggedMs).toBe(3_600_000);
    expect(summary.averageCycleMs).toBe(26 * 60 * 60 * 1000);
    expect(summary.longestTicket?.title).toBe("Ship analytics");
  });

  it("exports top tickets as CSV", () => {
    const csv = analyticsCsv(buildAnalytics(data, range));

    expect(csv).toContain("Ship analytics");
    expect(csv).toContain("Time logged (minutes)");
  });
});
