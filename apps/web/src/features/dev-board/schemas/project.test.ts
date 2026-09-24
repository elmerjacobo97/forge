import { describe, expect, it } from "vitest";

import { projectSchema } from "./project";

describe("projectSchema", () => {
  it("accepts a valid name and optional description", () => {
    expect(
      projectSchema.parse({ name: "Forge", description: "Dev tools", status: "planned" }),
    ).toEqual({
      name: "Forge",
      description: "Dev tools",
      status: "planned",
    });
  });

  it("accepts an empty description", () => {
    expect(projectSchema.parse({ name: "Forge", description: "", status: "planned" })).toEqual({
      name: "Forge",
      description: "",
      status: "planned",
    });
  });

  it("trims name and description", () => {
    expect(
      projectSchema.parse({ name: "  Forge  ", description: "  notes  ", status: "paused" }),
    ).toEqual({
      name: "Forge",
      description: "notes",
      status: "paused",
    });
  });

  it.each(["planned", "in_progress", "paused", "completed", "archived"])(
    "accepts project status %s",
    (status) => {
      expect(projectSchema.parse({ name: "Forge", description: "", status }).status).toBe(status);
    },
  );

  it.each(["unknown", "In Progress", ""])("rejects invalid project status %s", (status) => {
    expect(projectSchema.safeParse({ name: "Forge", description: "", status }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = projectSchema.safeParse({ name: "   ", description: "", status: "planned" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 80 characters", () => {
    const result = projectSchema.safeParse({
      name: "x".repeat(81),
      description: "",
      status: "planned",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 2000 characters", () => {
    const result = projectSchema.safeParse({
      name: "Forge",
      description: "x".repeat(2001),
      status: "planned",
    });
    expect(result.success).toBe(false);
  });
});
