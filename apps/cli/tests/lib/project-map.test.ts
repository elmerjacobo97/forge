import { describe, expect, it } from "vitest";
import type { ProjectFlow, ProjectMap } from "@forge/core";
import { parseFlowFileText } from "../../src/commands/project-map.js";
import { formatProjectFlowText, formatProjectMapText } from "../../src/format.js";

const flow: ProjectFlow = {
  id: "f1",
  projectId: "p1",
  moduleSlug: "dev-board",
  slug: "create-project",
  title: "Create project",
  summary: "",
  steps: [
    { kind: "ui", label: "Open dialog", inferred: true },
    {
      kind: "service",
      label: "Insert row",
      file: "src/projects.ts",
      line: 42,
      input: "name",
      output: "Project",
      inferred: false,
    },
  ],
  commit: null,
  updatedAt: "2026-10-17T00:00:00.000Z",
};

describe("parseFlowFileText", () => {
  it("rejects invalid JSON with a clear message", () => {
    expect(parseFlowFileText("{ nope")).toEqual({
      error: expect.stringContaining("Invalid JSON in --file"),
    });
  });

  it("rejects a valid JSON that breaks the flow schema", () => {
    const text = JSON.stringify({ moduleSlug: "a", slug: "b", title: "T", steps: [] });

    expect(parseFlowFileText(text)).toHaveProperty("error");
  });

  it("accepts a flow and applies defaults", () => {
    const text = JSON.stringify({
      moduleSlug: "a",
      slug: "b",
      title: "T",
      steps: [{ kind: "tool", label: "Call" }],
    });

    expect(parseFlowFileText(text)).toMatchObject({
      commit: null,
      steps: [{ kind: "tool", label: "Call", inferred: false }],
    });
  });
});

describe("formatProjectMapText", () => {
  it("groups flows under their module with dependencies", () => {
    const map: ProjectMap = {
      modules: [
        {
          id: "m1",
          projectId: "p1",
          slug: "auth",
          name: "Auth",
          description: "",
          dependsOn: [],
          updatedAt: "",
        },
        {
          id: "m2",
          projectId: "p1",
          slug: "dev-board",
          name: "Dev Board",
          description: "",
          dependsOn: ["auth"],
          updatedAt: "",
        },
      ],
      flows: [
        {
          id: "f1",
          projectId: "p1",
          moduleSlug: "dev-board",
          slug: "create-project",
          title: "Create project",
          summary: "",
          commit: null,
          updatedAt: "",
          stepCount: 2,
        },
      ],
    };

    expect(formatProjectMapText(map)).toBe(
      "auth  Auth\n\ndev-board  Dev Board  -> auth\n  create-project  Create project (2 steps)",
    );
    expect(formatProjectMapText({ modules: [], flows: [] })).toBe("No modules.");
  });
});

describe("formatProjectFlowText", () => {
  it("numbers steps with kind, file:line, inferred mark and io", () => {
    const text = formatProjectFlowText(flow);

    expect(text).toContain("1. [ui] Open dialog [inferred]");
    expect(text).toContain("2. [service] Insert row src/projects.ts:42 (in: name; out: Project)");
  });
});
