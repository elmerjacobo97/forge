import { describe, expect, it } from "vitest";

import { buildOtherFormatFilter, buildResourceSearchFilter } from "./query-filters";

describe("buildResourceSearchFilter", () => {
  it("builds an or filter for title, content and tags", () => {
    expect(buildResourceSearchFilter("react")).toBe(
      'title.ilike."%react%",content.ilike."%react%",tags.cs.{"react"}',
    );
  });

  it("quotes values with commas, spaces and braces", () => {
    expect(buildResourceSearchFilter("react docs, {tips}")).toBe(
      'title.ilike."%react docs, {tips}%",content.ilike."%react docs, {tips}%",tags.cs.{"react docs, {tips}"}',
    );
  });

  it("escapes percent and underscore in the ilike pattern", () => {
    expect(buildResourceSearchFilter("100%_off")).toBe(
      String.raw`title.ilike."%100\\%\\_off%",content.ilike."%100\\%\\_off%",tags.cs.{"100%_off"}`,
    );
  });

  it("escapes double quotes and backslashes", () => {
    expect(buildResourceSearchFilter('a"b\\c')).toBe(
      String.raw`title.ilike."%a\"b\\\\c%",content.ilike."%a\"b\\\\c%",tags.cs.{"a\"b\\c"}`,
    );
  });
});

describe("buildOtherFormatFilter", () => {
  it("matches other and unknown formats", () => {
    expect(buildOtherFormatFilter()).toBe(
      'language.eq.other,language.not.in.("json","yaml","javascript","typescript","markdown","env","plain-text")',
    );
  });
});
