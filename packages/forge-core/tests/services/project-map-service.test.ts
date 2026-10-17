import { describe, expect, it } from "vitest";
import { createProjectMapService } from "../../src/project-map-service.js";
import type { ProjectFlowUpsertInput } from "../../src/types.js";
import { createTableClient } from "../helpers/table-client.js";

const P = "project-1";
const module = { slug: "dev-board", name: "Dev Board", description: "", dependsOn: [] };
const flow: ProjectFlowUpsertInput = {
  moduleSlug: "dev-board",
  slug: "create-project",
  title: "Create project",
  summary: "",
  steps: [{ kind: "action", label: "Submit", inferred: false }],
  commit: null,
};

function setup() {
  const { client, tables } = createTableClient();
  return { service: createProjectMapService({ client }), tables };
}

describe("projectMapService.upsertModule", () => {
  it("creates, then replaces by slug without a new row", async () => {
    const { service, tables } = setup();

    const created = await service.upsertModule(P, module);
    const replaced = await service.upsertModule(P, { ...module, name: "Board" });

    expect(replaced.id).toBe(created.id);
    expect(replaced.name).toBe("Board");
    expect(tables.project_modules).toHaveLength(1);
  });

  it("rejects an unknown or own slug in dependsOn", async () => {
    const { service } = setup();

    await expect(service.upsertModule(P, { ...module, dependsOn: ["ghost"] })).rejects.toThrow(
      "Unknown module in depends_on: ghost.",
    );
    await expect(service.upsertModule(P, { ...module, dependsOn: ["dev-board"] })).rejects.toThrow(
      "cannot depend on itself",
    );
  });

  it("accepts a dependency that exists", async () => {
    const { service } = setup();
    await service.upsertModule(P, module);

    const auth = await service.upsertModule(P, {
      ...module,
      slug: "auth",
      dependsOn: ["dev-board"],
    });

    expect(auth.dependsOn).toEqual(["dev-board"]);
  });
});

describe("projectMapService flows", () => {
  it("reports a missing module", async () => {
    const { service } = setup();

    await expect(service.upsertFlow(P, flow)).rejects.toThrow("Module not found.");
  });

  it("creates, replaces by slug and reads back with the module slug", async () => {
    const { service, tables } = setup();
    await service.upsertModule(P, module);

    await service.upsertFlow(P, flow);
    await service.upsertFlow(P, { ...flow, title: "Create a project" });

    expect(tables.project_flows).toHaveLength(1);
    await expect(service.getFlow(P, "create-project")).resolves.toMatchObject({
      moduleSlug: "dev-board",
      title: "Create a project",
    });
  });

  it("getMap lists modules and flow summaries with step count", async () => {
    const { service } = setup();
    await service.upsertModule(P, module);
    await service.upsertFlow(P, flow);

    const map = await service.getMap(P);

    expect(map.modules).toHaveLength(1);
    expect(map.flows).toEqual([
      expect.objectContaining({ slug: "create-project", moduleSlug: "dev-board", stepCount: 1 }),
    ]);
    expect(map.flows[0]).not.toHaveProperty("steps");
  });

  it("deletes a flow and reports missing ones", async () => {
    const { service, tables } = setup();
    await service.upsertModule(P, module);
    await service.upsertFlow(P, flow);

    await service.deleteFlow(P, "create-project");

    expect(tables.project_flows).toHaveLength(0);
    await expect(service.deleteFlow(P, "create-project")).rejects.toThrow("Flow not found.");
    await expect(service.deleteModule(P, "ghost")).rejects.toThrow("Module not found.");
  });
});
