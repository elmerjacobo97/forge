import { describe, expect, it, vi } from "vitest";
import {
  formatEventText,
  formatReportJson,
  formatReportText,
  writeReportOutput,
} from "../../src/report-format.js";
import type { ActivityReport, Ticket, TicketComment, TicketEvent } from "../../src/types.js";

const sampleTicket: Ticket = {
  id: "t1",
  projectId: "p1",
  title: "Ship CLI tickets",
  description: "",
  column: "validation",
  position: 1000,
  priority: "high",
  createdAt: "2026-09-01T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 0,
  isPaused: false,
  lastMovedAt: "2026-09-08T10:00:00.000Z",
  branch: "feat/ticket-report",
  prUrl: null,
};

const sampleEvent: TicketEvent = {
  id: "e1",
  ticketId: "t1",
  eventType: "moved",
  fromColumn: "todo",
  toColumn: "in_progress",
  occurredAt: "2026-09-08T10:00:00.000Z",
};

const sampleComment: TicketComment = {
  id: "c1",
  ticketId: "t1",
  author: "agent",
  body: "Implemented; tests green",
  createdAt: "2026-09-08T11:00:00.000Z",
};

const sampleReport: ActivityReport = {
  from: "2026-09-04T21:00:00.000Z",
  to: "2026-09-11T21:00:00.000Z",
  days: 7,
  tickets: [
    {
      ticket: sampleTicket,
      project: { id: "p1", name: "Forge" },
      events: [sampleEvent],
      comments: [sampleComment],
    },
  ],
};

describe("formatEventText", () => {
  it("renders moves with both columns", () => {
    expect(formatEventText(sampleEvent)).toBe("moved todo -> in_progress");
    expect(formatEventText({ ...sampleEvent, fromColumn: null, toColumn: "done" })).toBe(
      "moved ? -> done",
    );
  });

  it("renders other event types as-is", () => {
    expect(formatEventText({ ...sampleEvent, eventType: "created" })).toBe("created");
    expect(formatEventText({ ...sampleEvent, eventType: "completed" })).toBe("completed");
  });
});

describe("formatReportText", () => {
  it("renders the window, tickets, events, and comments", () => {
    const text = formatReportText(sampleReport);
    expect(text).toContain(
      "Window: 2026-09-04T21:00:00.000Z -> 2026-09-11T21:00:00.000Z (7 day(s))",
    );
    expect(text).toContain("Forge - Ship CLI tickets [validation]");
    expect(text).toContain("  - 2026-09-08T10:00:00.000Z moved todo -> in_progress");
    expect(text).toContain("  - 2026-09-08T11:00:00.000Z [agent] Implemented; tests green");
  });

  it("handles an empty report", () => {
    expect(formatReportText({ ...sampleReport, tickets: [] })).toBe(
      "No activity from 2026-09-04T21:00:00.000Z to 2026-09-11T21:00:00.000Z.",
    );
  });

  it("falls back for unknown projects and null columns", () => {
    const text = formatReportText({
      ...sampleReport,
      tickets: [
        {
          ...sampleReport.tickets[0],
          project: null,
          events: [{ ...sampleEvent, fromColumn: null }],
        },
      ],
    });
    expect(text).toContain("(unknown project) - Ship CLI tickets");
    expect(text).toContain("moved ? -> in_progress");
  });
});

describe("formatReportJson", () => {
  it("emits parseable report JSON", () => {
    const parsed = JSON.parse(formatReportJson(sampleReport)) as ActivityReport;
    expect(parsed).toEqual(sampleReport);
  });
});

describe("writeReportOutput", () => {
  it("writes text without --json", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeReportOutput(sampleReport, false);
    expect(spy).toHaveBeenCalledWith(`${formatReportText(sampleReport)}\n`);
    spy.mockRestore();
  });

  it("writes JSON with --json", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeReportOutput(sampleReport, true);
    expect(spy).toHaveBeenCalledWith(formatReportJson(sampleReport));
    spy.mockRestore();
  });
});
