import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { ResourceFilters } from "../schemas/resource-filters";
import type { Resource } from "../types";
import { buildOtherFormatFilter, buildResourceSearchFilter } from "../utils/query-filters";

const resourceToolSchema = z.enum([
  "react-native",
  "vscode",
  "cursor",
  "opencode",
  "claude-code",
  "other",
]);

const resourceRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["note", "prompt", "config", "code"]),
  content: z.string(),
  language: z.string().nullable(),
  tags: z.array(z.string()),
  tool: resourceToolSchema.nullable(),
  custom_tool: z.string().nullable(),
  version: z.string().nullable(),
  context: z.string().nullable(),
  created_at: z.string(),
});

export type ResourceInput = Omit<Resource, "id" | "createdAt">;

const resourceSelect =
  "id,title,kind,content,language,tags,tool,custom_tool,version,context,created_at";

function toResource(value: unknown): Resource {
  const row = resourceRowSchema.parse(value);
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    content: row.content,
    language: row.language,
    tags: row.tags,
    tool: row.tool,
    customTool: row.custom_tool,
    version: row.version,
    context: row.context,
    createdAt: row.created_at,
  };
}

function toResourcePayload(resource: ResourceInput) {
  return {
    title: resource.title,
    kind: resource.kind,
    content: resource.content,
    language: resource.language,
    tags: resource.tags,
    tool: resource.tool,
    custom_tool: resource.customTool,
    version: resource.version,
    context: resource.context,
  };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export interface ResourcesPage {
  resources: Resource[];
  tags: string[];
  total: number;
}

const resourceTagsRowSchema = z.object({
  tags: z.array(z.string()),
});

export const resourcesService = {
  async fetchResourcesPage(filters: ResourceFilters, visible: number): Promise<ResourcesPage> {
    const insforge = await createInsForgeServerClient();
    let query = insforge.database.from("resources").select(resourceSelect, { count: "exact" });

    if (filters.kind !== "all") {
      query = query.eq("kind", filters.kind);
    }

    if (filters.tool !== "all") {
      query = query.eq("tool", filters.tool);
    }

    if (filters.tag !== "all") {
      query = query.contains("tags", [filters.tag]);
    }

    if (filters.format === "other") {
      query = query.or(buildOtherFormatFilter());
    } else if (filters.format !== "all") {
      query = query.eq("language", filters.format);
    }

    const search = filters.q.trim();
    if (search) {
      query = query.or(buildResourceSearchFilter(search));
    }

    const [pageResult, tagsResult] = await Promise.all([
      query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, visible - 1),
      insforge.database.from("resources").select("tags"),
    ]);
    if (pageResult.error) throw failure(pageResult.error, "Failed to load resources.");
    if (tagsResult.error) throw failure(tagsResult.error, "Failed to load resource tags.");

    const resources = resourceRowSchema.array().parse(pageResult.data).map(toResource);
    const tags = Array.from(
      new Set(
        resourceTagsRowSchema
          .array()
          .parse(tagsResult.data)
          .flatMap((row) => row.tags),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return {
      resources,
      tags,
      total: pageResult.count ?? 0,
    };
  },

  async createResource(resource: ResourceInput): Promise<Resource> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("resources")
      .insert([toResourcePayload(resource)])
      .select(resourceSelect)
      .single();
    if (error) throw failure(error, "Failed to create resource.");
    return toResource(data);
  },

  async updateResource(resourceId: string, resource: ResourceInput): Promise<Resource> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("resources")
      .update(toResourcePayload(resource))
      .eq("id", resourceId)
      .select(resourceSelect)
      .single();
    if (error) throw failure(error, "Failed to update resource.");
    return toResource(data);
  },

  async deleteResource(resourceId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("resources").delete().eq("id", resourceId);
    if (error) throw failure(error, "Failed to delete resource.");
  },
};
