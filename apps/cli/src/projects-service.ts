import type { InsForgeClient } from "@insforge/sdk"
import {
  asRecord,
  asRows,
  errorMessage,
  stringField,
  throwIfError,
} from "./insforge-data.js"
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
} from "./types.js"

const TABLE = "dev_board_projects"
const COLUMNS = "id,name,description,created_at"

export const PROJECT_HAS_TICKETS_MESSAGE =
  "Cannot delete a project that still has tickets. Delete its tickets first."

export function mapRowToProject(value: unknown): Project {
  const row = asRecord(value, "project row")
  return {
    id: stringField(row, "id", "project row"),
    name: stringField(row, "name", "project row"),
    description: stringField(row, "description", "project row"),
    createdAt: stringField(row, "created_at", "project row"),
  }
}

export type ProjectsServiceDeps = { client: InsForgeClient }

export function createProjectsService({ client }: ProjectsServiceDeps) {
  async function get(id: string): Promise<Project> {
    const response = await client.database
      .from(TABLE)
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle()
    throwIfError(response.error, "Failed to get project.")
    const data: unknown = response.data
    if (data === null) throw new Error("Project not found.")
    return mapRowToProject(data)
  }

  return {
    async list(): Promise<Project[]> {
      const response = await client.database
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false })
      throwIfError(response.error, "Failed to list projects.")
      const data: unknown = response.data
      return asRows(data, "project list").map(mapRowToProject)
    },

    get,

    async create(input: ProjectCreateInput): Promise<Project> {
      const response = await client.database
        .from(TABLE)
        .insert([{ name: input.name, description: input.description }])
        .select(COLUMNS)
        .single()
      throwIfError(response.error, "Failed to create project.")
      const data: unknown = response.data
      return mapRowToProject(data)
    },

    async update(id: string, input: ProjectUpdateInput): Promise<Project> {
      const changes: Record<string, string> = {}
      if (input.name !== undefined) changes.name = input.name
      if (input.description !== undefined) changes.description = input.description
      if (Object.keys(changes).length === 0) {
        throw new Error("Nothing to update. Provide at least one field.")
      }

      await get(id)
      const response = await client.database
        .from(TABLE)
        .update(changes)
        .eq("id", id)
        .select(COLUMNS)
        .single()
      throwIfError(response.error, "Failed to update project.")
      const data: unknown = response.data
      return mapRowToProject(data)
    },

    async delete(id: string): Promise<void> {
      const response = await client.database.rpc("delete_empty_dev_board_project", {
        p_project_id: id,
      })
      if (response.error) {
        const message = errorMessage(response.error, "Failed to delete project.")
        if (message.includes("Project has tickets")) {
          throw new Error(PROJECT_HAS_TICKETS_MESSAGE)
        }
        throw new Error(message)
      }
      if (response.data !== true) {
        throw new Error("Invalid project delete response.")
      }
    },
  }
}

export type ProjectsService = ReturnType<typeof createProjectsService>
