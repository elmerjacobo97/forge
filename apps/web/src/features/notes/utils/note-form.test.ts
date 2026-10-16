import { describe, expect, it } from "vitest";

import { projectIdFromValue, projectValueFromId } from "./note-form";

describe("note form project mapping", () => {
  it("maps the no-project value to null and back", () => {
    expect(projectIdFromValue("none")).toBeNull();
    expect(projectValueFromId(null)).toBe("none");
  });

  it("keeps a project id unchanged", () => {
    expect(projectIdFromValue("p-1")).toBe("p-1");
    expect(projectValueFromId("p-1")).toBe("p-1");
  });
});
