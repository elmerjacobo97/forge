import { describe, expect, it } from "vitest";
import {
  parseProjectFlowUpsertInput,
  parseProjectModuleUpsertInput,
} from "../../src/project-map-schema.js";

const step = { kind: "action", label: "Create project" };
const flow = { moduleSlug: "dev-board", slug: "create-project", title: "Create", steps: [step] };

describe("parseProjectModuleUpsertInput", () => {
  it("applies defaults", () => {
    expect(parseProjectModuleUpsertInput({ slug: "dev-board", name: "Dev Board" })).toEqual({
      slug: "dev-board",
      name: "Dev Board",
      description: "",
      dependsOn: [],
    });
  });

  it.each(["Dev-Board", "dev board", "a".repeat(61), "-x"])("rejects slug %j", (slug) => {
    expect(parseProjectModuleUpsertInput({ slug, name: "x" })).toHaveProperty("error");
  });
});

describe("parseProjectFlowUpsertInput", () => {
  it("defaults inferred to false and commit to null", () => {
    expect(parseProjectFlowUpsertInput(flow)).toMatchObject({
      commit: null,
      summary: "",
      steps: [{ kind: "action", label: "Create project", inferred: false }],
    });
  });

  it("rejects 0 and 21 steps, accepts 20", () => {
    expect(parseProjectFlowUpsertInput({ ...flow, steps: [] })).toHaveProperty("error");
    expect(parseProjectFlowUpsertInput({ ...flow, steps: Array(21).fill(step) })).toHaveProperty(
      "error",
    );
    expect(
      parseProjectFlowUpsertInput({ ...flow, steps: Array(20).fill(step) }),
    ).not.toHaveProperty("error");
  });

  it("rejects an unknown kind and an absolute file", () => {
    expect(
      parseProjectFlowUpsertInput({ ...flow, steps: [{ ...step, kind: "cron" }] }),
    ).toHaveProperty("error");
    expect(
      parseProjectFlowUpsertInput({ ...flow, steps: [{ ...step, file: "/Users/x/a.ts" }] }),
    ).toHaveProperty("error");
  });

  it("rejects a commit over 40 characters", () => {
    expect(parseProjectFlowUpsertInput({ ...flow, commit: "a".repeat(41) })).toHaveProperty(
      "error",
    );
  });
});
