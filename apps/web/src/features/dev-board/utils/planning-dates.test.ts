import { describe, expect, it } from "vitest";

import {
  formatLocalDateTime,
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
