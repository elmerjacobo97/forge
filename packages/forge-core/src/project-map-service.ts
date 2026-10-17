import type { InsForgeClient } from "@insforge/sdk";
import { asRecord, asRows, stringField, throwIfError } from "./insforge-data.js";
import type {
  ProjectFlow,
  ProjectFlowStep,
  ProjectFlowSummary,
  ProjectFlowUpsertInput,
  ProjectMap,
  ProjectModule,
  ProjectModuleUpsertInput,
} from "./types.js";

const MODULES = "project_modules";
const FLOWS = "project_flows";
const MODULE_COLUMNS = "id,project_id,slug,name,description,depends_on,updated_at";
const FLOW_COLUMNS = "id,project_id,module_id,slug,title,summary,steps,commit,updated_at";

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid project module row: ${field} must be a string array.`);
  }
  return value;
}

function asSteps(value: unknown): ProjectFlowStep[] {
  if (!Array.isArray(value)) throw new Error("Invalid project flow row: steps must be an array.");
  return value as ProjectFlowStep[];
}

export function mapRowToProjectModule(value: unknown): ProjectModule {
  const row = asRecord(value, "project module row");

  return {
    id: stringField(row, "id", "project module row"),
    projectId: stringField(row, "project_id", "project module row"),
    slug: stringField(row, "slug", "project module row"),
    name: stringField(row, "name", "project module row"),
    description: stringField(row, "description", "project module row"),
    dependsOn: asStringArray(row.depends_on, "depends_on"),
    updatedAt: stringField(row, "updated_at", "project module row"),
  };
}

export function mapRowToProjectFlow(value: unknown, moduleSlug: string): ProjectFlow {
  const row = asRecord(value, "project flow row");
  const commit = row.commit;
  if (commit !== null && typeof commit !== "string") {
    throw new Error("Invalid project flow row: commit must be a string or null.");
  }

  return {
    id: stringField(row, "id", "project flow row"),
    projectId: stringField(row, "project_id", "project flow row"),
    moduleSlug,
    slug: stringField(row, "slug", "project flow row"),
    title: stringField(row, "title", "project flow row"),
    summary: stringField(row, "summary", "project flow row"),
    steps: asSteps(row.steps),
    commit,
    updatedAt: stringField(row, "updated_at", "project flow row"),
  };
}

export type ProjectMapServiceDeps = { client: InsForgeClient };

export function createProjectMapService({ client }: ProjectMapServiceDeps) {
  async function listModules(projectId: string): Promise<ProjectModule[]> {
    const response = await client.database
      .from(MODULES)
      .select(MODULE_COLUMNS)
      .eq("project_id", projectId)
      .order("slug", { ascending: true });
    throwIfError(response.error, "Failed to list project modules.");
    const data: unknown = response.data;
    return asRows(data, "project module list").map(mapRowToProjectModule);
  }

  async function findModule(projectId: string, slug: string): Promise<ProjectModule | null> {
    const response = await client.database
      .from(MODULES)
      .select(MODULE_COLUMNS)
      .eq("project_id", projectId)
      .eq("slug", slug)
      .maybeSingle();
    throwIfError(response.error, "Failed to get project module.");
    const data: unknown = response.data;
    return data === null ? null : mapRowToProjectModule(data);
  }

  async function findFlowRow(projectId: string, slug: string): Promise<unknown> {
    const response = await client.database
      .from(FLOWS)
      .select(FLOW_COLUMNS)
      .eq("project_id", projectId)
      .eq("slug", slug)
      .maybeSingle();
    throwIfError(response.error, "Failed to get project flow.");
    const data: unknown = response.data;
    return data;
  }

  async function assertDependencies(projectId: string, input: ProjectModuleUpsertInput) {
    if (input.dependsOn.includes(input.slug)) {
      throw new Error("A module cannot depend on itself.");
    }
    if (input.dependsOn.length === 0) return;
    const known = new Set((await listModules(projectId)).map((module) => module.slug));
    const missing = input.dependsOn.filter((slug) => !known.has(slug));
    if (missing.length > 0) throw new Error(`Unknown module in depends_on: ${missing.join(", ")}.`);
  }

  return {
    async getMap(projectId: string): Promise<ProjectMap> {
      const modules = await listModules(projectId);
      const response = await client.database
        .from(FLOWS)
        .select(FLOW_COLUMNS)
        .eq("project_id", projectId)
        .order("slug", { ascending: true });
      throwIfError(response.error, "Failed to list project flows.");
      const data: unknown = response.data;
      const slugById = new Map(modules.map((module) => [module.id, module.slug]));
      const flows = asRows(data, "project flow list").flatMap((row): ProjectFlowSummary[] => {
        const moduleSlug = slugById.get(
          stringField(asRecord(row, "project flow row"), "module_id", "project flow row"),
        );
        if (moduleSlug === undefined) return [];
        const { steps, ...summary } = mapRowToProjectFlow(row, moduleSlug);
        return [{ ...summary, stepCount: steps.length }];
      });
      return { modules, flows };
    },

    async upsertModule(projectId: string, input: ProjectModuleUpsertInput): Promise<ProjectModule> {
      await assertDependencies(projectId, input);
      const fields = {
        name: input.name,
        description: input.description,
        depends_on: input.dependsOn,
      };
      const existing = await findModule(projectId, input.slug);
      // ponytail: select-then-write, not atomic; a racing duplicate hits UNIQUE(project_id, slug)
      const response = existing
        ? await client.database
            .from(MODULES)
            .update(fields)
            .eq("id", existing.id)
            .select(MODULE_COLUMNS)
            .single()
        : await client.database
            .from(MODULES)
            .insert([{ ...fields, project_id: projectId, slug: input.slug }])
            .select(MODULE_COLUMNS)
            .single();
      throwIfError(response.error, "Failed to save project module.");
      const data: unknown = response.data;
      return mapRowToProjectModule(data);
    },

    async deleteModule(projectId: string, slug: string): Promise<void> {
      const existing = await findModule(projectId, slug);
      if (existing === null) throw new Error("Module not found.");
      const response = await client.database.from(MODULES).delete().eq("id", existing.id);
      throwIfError(response.error, "Failed to delete project module.");
    },

    async getFlow(projectId: string, slug: string): Promise<ProjectFlow> {
      const row = await findFlowRow(projectId, slug);
      if (row === null) throw new Error("Flow not found.");
      const moduleId = stringField(
        asRecord(row, "project flow row"),
        "module_id",
        "project flow row",
      );
      const module = (await listModules(projectId)).find((item) => item.id === moduleId);
      if (module === undefined) throw new Error("Module not found.");
      return mapRowToProjectFlow(row, module.slug);
    },

    async upsertFlow(projectId: string, input: ProjectFlowUpsertInput): Promise<ProjectFlow> {
      const module = await findModule(projectId, input.moduleSlug);
      if (module === null) throw new Error("Module not found.");
      const fields = {
        module_id: module.id,
        title: input.title,
        summary: input.summary,
        steps: input.steps,
        commit: input.commit,
      };
      const existing = await findFlowRow(projectId, input.slug);
      const response =
        existing === null
          ? await client.database
              .from(FLOWS)
              .insert([{ ...fields, project_id: projectId, slug: input.slug }])
              .select(FLOW_COLUMNS)
              .single()
          : await client.database
              .from(FLOWS)
              .update(fields)
              .eq(
                "id",
                stringField(asRecord(existing, "project flow row"), "id", "project flow row"),
              )
              .select(FLOW_COLUMNS)
              .single();
      throwIfError(response.error, "Failed to save project flow.");
      const data: unknown = response.data;
      return mapRowToProjectFlow(data, module.slug);
    },

    async deleteFlow(projectId: string, slug: string): Promise<void> {
      const row = await findFlowRow(projectId, slug);
      if (row === null) throw new Error("Flow not found.");
      const id = stringField(asRecord(row, "project flow row"), "id", "project flow row");
      const response = await client.database.from(FLOWS).delete().eq("id", id);
      throwIfError(response.error, "Failed to delete project flow.");
    },
  };
}

export type ProjectMapService = ReturnType<typeof createProjectMapService>;
