import { describe, expect, it } from "vitest";

import {
  formatLocalDateTime,
  formatShortDateRange,
  isOverdue,
  localDateTimeInputToIso,
  toLocalDateTimeInput,
} from "./planning-dates";

describe("planning date conversions", () => {
  it("converts local input to an ISO timestamp and back in the same timezone", () => {
    const localValue = "2026-09-28T21:29";
    const timestamp = localDateTimeInputToIso(localValue);

    expect(timestamp).toBe(new Date(localValue).toISOString());
    expect(toLocalDateTimeInput(timestamp)).toBe(localValue);
  });

  it("normalizes cleared date inputs to null", () => {
    expect(localDateTimeInputToIso("")).toBeNull();
    expect(toLocalDateTimeInput(null)).toBe("");
  });

  it("rejects malformed local date-time values", () => {
    expect(() => localDateTimeInputToIso("not-a-date")).toThrow(
      "Choose a valid local date and time.",
    );
  });

  it("formats persisted timestamps in the user's local timezone", () => {
    const timestamp = new Date(2026, 8, 28, 21, 29).toISOString();

    expect(formatLocalDateTime(timestamp)).toBe(
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(timestamp),
      ),
    );
    expect(formatLocalDateTime(null)).toBeNull();
  });
});

describe("card planning helpers", () => {
  it("formats a short date range and handles partial dates", () => {
    expect(formatShortDateRange(null, null)).toBeNull();
    expect(formatShortDateRange("2026-01-05T12:00:00Z", "2026-01-09T12:00:00Z")).toContain("→");
    expect(formatShortDateRange("2026-01-05T12:00:00Z", null)).toMatch(/^From /);
    expect(formatShortDateRange(null, "2026-01-09T12:00:00Z")).toMatch(/^Due /);
  });

  it("flags overdue only when past due and not done", () => {
    const now = Date.parse("2026-09-30T00:00:00Z");

    expect(isOverdue("2026-09-29T00:00:00Z", false, now)).toBe(true);
    expect(isOverdue("2026-09-29T00:00:00Z", true, now)).toBe(false);
    expect(isOverdue("2026-10-01T00:00:00Z", false, now)).toBe(false);
    expect(isOverdue(null, false, now)).toBe(false);
  });
});
