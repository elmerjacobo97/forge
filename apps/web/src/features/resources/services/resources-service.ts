import { z } from "zod";

import { insforge } from "@/lib/insforge/browser";
import type { Resource } from "../types";

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

type ResourceInput = Omit<Resource, "id" | "createdAt">;
const resourceSelect =
  "id,title,kind,content,language,tags,tool,custom_tool,version,context,created_at";

function requireUser(userId?: string): void {
  if (!userId) throw new Error("Sign in to use Resources.");
}

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

export const resourcesService = {
  async fetchResources(userId?: string): Promise<Resource[]> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("resources")
      .select(resourceSelect)
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load resources.");
    return resourceRowSchema.array().parse(data).map(toResource);
  },

  async createResource(resource: ResourceInput, userId?: string): Promise<Resource> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("resources")
      .insert([toResourcePayload(resource)])
      .select(resourceSelect)
      .single();
    if (error) throw failure(error, "Failed to create resource.");
    return toResource(data);
  },

  async updateResource(
    resourceId: string,
    resource: ResourceInput,
    userId?: string,
  ): Promise<Resource> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("resources")
      .update(toResourcePayload(resource))
      .eq("id", resourceId)
      .select(resourceSelect)
      .single();
    if (error) throw failure(error, "Failed to update resource.");
    return toResource(data);
  },

  async deleteResource(resourceId: string, userId?: string): Promise<void> {
    requireUser(userId);
    const { error } = await insforge.database.from("resources").delete().eq("id", resourceId);
    if (error) throw failure(error, "Failed to delete resource.");
  },
};
