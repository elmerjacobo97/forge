import { describe, expect, it } from "vitest";

import { buildNoteSearchFilter } from "./query-filters";

describe("buildNoteSearchFilter", () => {
  it("builds an or filter for title, content and lowercased tag", () => {
    expect(buildNoteSearchFilter("Expo")).toBe(
      'title.ilike."%Expo%",content.ilike."%Expo%",tags.cs.{"expo"}',
    );
  });

  it("escapes percent and underscore in the ilike pattern", () => {
    expect(buildNoteSearchFilter("100%_off")).toBe(
      String.raw`title.ilike."%100\\%\\_off%",content.ilike."%100\\%\\_off%",tags.cs.{"100%_off"}`,
    );
  });
});
