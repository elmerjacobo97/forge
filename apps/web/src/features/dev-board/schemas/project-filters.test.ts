import { describe, expect, it } from "vitest";

import { parseProjectFilters } from "./project-filters";

describe("parseProjectFilters", () => {
  it("defaults to an empty search, all non-archived statuses, and default ordering", () => {
    expect(parseProjectFilters({})).toEqual({ q: "", status: "all", sort: "status" });
  });

  it("trims a search and accepts a status and sort", () => {
    expect(parseProjectFilters({ q: "  forge board  ", status: "paused", sort: "name" })).toEqual({
      q: "forge board",
      status: "paused",
      sort: "name",
    });
  });

  it("defaults invalid parameters independently", () => {
    expect(parseProjectFilters({ q: "  notes  ", status: "running", sort: "random" })).toEqual({
      q: "notes",
      status: "all",
      sort: "status",
    });
  });

  it("ignores repeated query parameters instead of applying ambiguous values", () => {
    expect(parseProjectFilters({ q: ["first", "second"], status: ["paused"] })).toEqual({
      q: "",
      status: "all",
      sort: "status",
    });
  });

  it("accepts archived as an explicit status filter", () => {
    expect(parseProjectFilters({ status: "archived" })).toMatchObject({ status: "archived" });
  });
});
