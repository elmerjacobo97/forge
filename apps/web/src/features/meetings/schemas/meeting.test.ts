import { describe, expect, it } from "vitest";

import {
  meetingFiltersSchema,
  meetingFormSchema,
  meetingSchema,
  parseMeetingFilters,
} from "./meeting";

const meetingInput = {
  projectId: null,
  title: "Weekly planning",
  meetingAt: "2026-09-26T10:00:00.000Z",
  attendees: ["Alex", "Sam"],
  context: "Plan the next release.",
  decisions: ["Ship the smaller scope first."],
};

describe("meetingSchema", () => {
  it("accepts a general meeting and trims its title", () => {
    expect(meetingSchema.parse({ ...meetingInput, title: "  Weekly planning  " })).toEqual({
      ...meetingInput,
      title: "Weekly planning",
    });
  });

  it("rejects an empty or oversized title and invalid date", () => {
    expect(meetingSchema.safeParse({ ...meetingInput, title: " " }).success).toBe(false);
    expect(meetingSchema.safeParse({ ...meetingInput, title: "x".repeat(201) }).success).toBe(
      false,
    );
    expect(meetingSchema.safeParse({ ...meetingInput, meetingAt: "yesterday" }).success).toBe(
      false,
    );
    expect(meetingSchema.safeParse({ ...meetingInput, projectId: "not-a-uuid" }).success).toBe(
      false,
    );
  });
});

describe("meetingFormSchema", () => {
  it("validates form values and normalizes them for the meeting action", () => {
    expect(
      meetingFormSchema.parse({
        projectId: "none",
        title: "  Weekly planning  ",
        meetingAt: "2026-09-26T10:00",
        attendees: " Alex \n\nSam  ",
        context: "Plan the next release.",
        decisions: "Ship the smaller scope first.\n\nReview next week.",
      }),
    ).toEqual({
      projectId: null,
      title: "Weekly planning",
      meetingAt: new Date("2026-09-26T10:00").toISOString(),
      attendees: ["Alex", "Sam"],
      context: "Plan the next release.",
      decisions: ["Ship the smaller scope first.", "Review next week."],
    });
  });

  it("rejects invalid project ids and empty dates", () => {
    const values = {
      projectId: "none",
      title: "Weekly planning",
      meetingAt: "2026-09-26T10:00",
      attendees: "",
      context: "",
      decisions: "",
    };
    expect(meetingFormSchema.safeParse({ ...values, projectId: "bad" }).success).toBe(false);
    expect(meetingFormSchema.safeParse({ ...values, meetingAt: "" }).success).toBe(false);
  });
});

describe("meetingFiltersSchema", () => {
  it("accepts a query and optional project filter", () => {
    expect(
      meetingFiltersSchema.parse({
        q: "  planning  ",
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      }),
    ).toEqual({ q: "planning", projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" });
    expect(meetingFiltersSchema.safeParse({ q: "", projectId: "bad" }).success).toBe(false);
  });

  it("reads and normalizes URL filters, falling back for invalid project ids", () => {
    expect(parseMeetingFilters({ q: "  roadmap ", projectId: "bad" })).toEqual({
      q: "",
      projectId: null,
    });
    expect(parseMeetingFilters({ q: "  roadmap " })).toEqual({ q: "roadmap", projectId: null });
  });
});
