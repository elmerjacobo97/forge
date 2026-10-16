import { describe, expect, it } from "vitest";

import { parseNoteFilters } from "./note-filters";

const projectId = "92acfbba-6bc4-456a-96eb-965ce5b090fd";

describe("parseNoteFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseNoteFilters({})).toEqual({ q: "", tag: "all", project: "all" });
  });

  it("reads q, tag and project", () => {
    expect(parseNoteFilters({ q: " expo ", tag: "rn-0.76", project: projectId })).toEqual({
      q: "expo",
      tag: "rn-0.76",
      project: projectId,
    });
  });

  it("falls back to defaults on an invalid project", () => {
    expect(parseNoteFilters({ q: "expo", project: "nope" })).toEqual({
      q: "",
      tag: "all",
      project: "all",
    });
  });
});
