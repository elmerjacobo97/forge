import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { FLOW_STEP_KINDS } from "../types";
import type { ProjectFlow, ProjectMap } from "../types";

const stepSchema = z.object({
  kind: z.enum(FLOW_STEP_KINDS),
  label: z.string(),
  symbol: z.string().optional(),
  file: z.string().optional(),
  line: z.number().optional(),
  input: z.string().optional(),
  output: z.string().optional(),
  inferred: z.boolean().default(false),
});

const moduleRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  depends_on: z.array(z.string()),
});

const flowRowSchema = z.object({
  module_id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  steps: z.array(stepSchema),
  commit: z.string().nullable(),
});

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

async function listModuleRows(projectId: string) {
  const insforge = await createInsForgeServerClient();
  const { data, error } = await insforge.database
    .from("project_modules")
    .select("id,slug,name,description,depends_on")
    .eq("project_id", projectId)
    .order("slug", { ascending: true });
  if (error) throw failure(error, "Failed to load project modules.");
  return z.array(moduleRowSchema).parse(data);
}

export const projectMapService = {
  async getMap(projectId: string): Promise<ProjectMap> {
    const insforge = await createInsForgeServerClient();
    const [moduleRows, flowsResponse] = await Promise.all([
      listModuleRows(projectId),
      insforge.database
        .from("project_flows")
        .select("module_id,slug,title,summary,steps,commit")
        .eq("project_id", projectId)
        .order("slug", { ascending: true }),
    ]);
    if (flowsResponse.error) throw failure(flowsResponse.error, "Failed to load project flows.");

    const slugById = new Map(moduleRows.map((row) => [row.id, row.slug]));
    const flows = z
      .array(flowRowSchema)
      .parse(flowsResponse.data)
      .flatMap((row) => {
        const moduleSlug = slugById.get(row.module_id);
        if (!moduleSlug) return [];
        return [
          {
            slug: row.slug,
            moduleSlug,
            title: row.title,
            summary: row.summary,
            stepCount: row.steps.length,
          },
        ];
      });

    return {
      modules: moduleRows.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
        dependsOn: row.depends_on,
      })),
      flows,
    };
  },

  async getFlow(projectId: string, slug: string): Promise<ProjectFlow | null> {
    const insforge = await createInsForgeServerClient();
    const [moduleRows, flowResponse] = await Promise.all([
      listModuleRows(projectId),
      insforge.database
        .from("project_flows")
        .select("module_id,slug,title,summary,steps,commit")
        .eq("project_id", projectId)
        .eq("slug", slug)
        .maybeSingle(),
    ]);
    if (flowResponse.error) throw failure(flowResponse.error, "Failed to load project flow.");
    if (!flowResponse.data) return null;

    const row = flowRowSchema.parse(flowResponse.data);
    const moduleSlug = moduleRows.find((item) => item.id === row.module_id)?.slug;
    if (!moduleSlug) return null;
    return {
      slug: row.slug,
      moduleSlug,
      title: row.title,
      summary: row.summary,
      steps: row.steps,
      commit: row.commit,
    };
  },

  async deleteModule(projectId: string, slug: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database
      .from("project_modules")
      .delete()
      .eq("project_id", projectId)
      .eq("slug", slug);
    if (error) throw failure(error, "Failed to delete module.");
  },

  async deleteFlow(projectId: string, slug: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database
      .from("project_flows")
      .delete()
      .eq("project_id", projectId)
      .eq("slug", slug);
    if (error) throw failure(error, "Failed to delete flow.");
  },
};
