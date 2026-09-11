import { describe, expect, it } from "vitest";

import { buildBookmarkSearchFilter } from "./query-filters";

describe("buildBookmarkSearchFilter", () => {
  it("builds an or filter for title, description and tags", () => {
    expect(buildBookmarkSearchFilter("react")).toBe(
      'title.ilike."%react%",description.ilike."%react%",tags.cs.{"react"}',
    );
  });

  it("quotes values with commas, spaces and braces", () => {
    expect(buildBookmarkSearchFilter("react docs, {tips}")).toBe(
      'title.ilike."%react docs, {tips}%",description.ilike."%react docs, {tips}%",tags.cs.{"react docs, {tips}"}',
    );
  });

  it("escapes percent and underscore in the ilike pattern", () => {
    expect(buildBookmarkSearchFilter("100%_off")).toBe(
      String.raw`title.ilike."%100\\%\\_off%",description.ilike."%100\\%\\_off%",tags.cs.{"100%_off"}`,
    );
  });

  it("escapes double quotes and backslashes", () => {
    expect(buildBookmarkSearchFilter('a"b\\c')).toBe(
      String.raw`title.ilike."%a\"b\\\\c%",description.ilike."%a\"b\\\\c%",tags.cs.{"a\"b\\c"}`,
    );
  });
});
