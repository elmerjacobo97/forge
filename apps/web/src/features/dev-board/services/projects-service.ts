import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { Project, ProjectCreateInput, ProjectUpdateInput } from "../types/project";

const projectRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  created_at: z.string(),
});

function toProject(value: unknown): Project {
  const row = projectRowSchema.parse(value);
  return { id: row.id, name: row.name, description: row.description, createdAt: row.created_at };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const projectsService = {
  async listProjects(): Promise<Project[]> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("dev_board_projects")
      .select("id,name,description,created_at")
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load projects.");
    return projectRowSchema.array().parse(data).map(toProject);
  },

  async getProject(projectId: string): Promise<Project> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("dev_board_projects")
      .select("id,name,description,created_at")
      .eq("id", projectId)
      .single();
    if (error) throw failure(error, "Project not found.");
    return toProject(data);
  },

  async createProject(input: ProjectCreateInput): Promise<Project> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("dev_board_projects")
      .insert([input])
      .select("id,name,description,created_at")
      .single();
    if (error) throw failure(error, "Failed to create project.");
    return toProject(data);
  },

  async updateProject(projectId: string, input: ProjectUpdateInput): Promise<Project> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("dev_board_projects")
      .update(input)
      .eq("id", projectId)
      .select("id,name,description,created_at")
      .single();
    if (error) throw failure(error, "Failed to update project.");
    return toProject(data);
  },

  async deleteProject(projectId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.rpc("delete_empty_dev_board_project", {
      p_project_id: projectId,
    });
    if (error) throw failure(error, "Failed to delete project.");
  },
};
