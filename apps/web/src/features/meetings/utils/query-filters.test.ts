import { describe, expect, it } from "vitest";

import { buildMeetingSearchFilter } from "./query-filters";

describe("buildMeetingSearchFilter", () => {
  it("searches title and context with escaped pattern characters", () => {
    expect(buildMeetingSearchFilter("design_50%")).toBe(
      'title.ilike."%design\\\\_50\\\\%%",context.ilike."%design\\\\_50\\\\%%"',
    );
  });
});
