import { describe, expect, it } from "vitest";

import { projectSchema } from "../schemas/project";

describe("projectSchema", () => {
  it("accepts a valid name and optional description", () => {
    expect(projectSchema.parse({ name: "Forge", description: "Dev tools" })).toEqual({
      name: "Forge",
      description: "Dev tools",
    });
  });

  it("accepts an empty description", () => {
    expect(projectSchema.parse({ name: "Forge", description: "" })).toEqual({
      name: "Forge",
      description: "",
    });
  });

  it("trims name and description", () => {
    expect(projectSchema.parse({ name: "  Forge  ", description: "  notes  " })).toEqual({
      name: "Forge",
      description: "notes",
    });
  });

  it("rejects an empty name", () => {
    const result = projectSchema.safeParse({ name: "   ", description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 80 characters", () => {
    const result = projectSchema.safeParse({ name: "x".repeat(81), description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 2000 characters", () => {
    const result = projectSchema.safeParse({
      name: "Forge",
      description: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
