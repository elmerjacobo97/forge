import { describe, expect, it } from "vitest";

import { buildIdeaSearchFilter } from "./query-filters";

describe("buildIdeaSearchFilter", () => {
  it("builds an or filter for title, content and tags", () => {
    expect(buildIdeaSearchFilter("coffee")).toBe(
      'title.ilike."%coffee%",content.ilike."%coffee%",tags.cs.{"coffee"}',
    );
  });

  it("quotes values with commas, spaces and braces", () => {
    expect(buildIdeaSearchFilter("coffee app, {social}")).toBe(
      'title.ilike."%coffee app, {social}%",content.ilike."%coffee app, {social}%",tags.cs.{"coffee app, {social}"}',
    );
  });

  it("escapes percent and underscore in the ilike pattern", () => {
    expect(buildIdeaSearchFilter("100%_off")).toBe(
      String.raw`title.ilike."%100\\%\\_off%",content.ilike."%100\\%\\_off%",tags.cs.{"100%_off"}`,
    );
  });

  it("escapes double quotes and backslashes", () => {
    expect(buildIdeaSearchFilter('a"b\\c')).toBe(
      String.raw`title.ilike."%a\"b\\\\c%",content.ilike."%a\"b\\\\c%",tags.cs.{"a\"b\\c"}`,
    );
  });
});
