import {
  ID,
  Permission,
  Query,
  Role,
  type Models,
  type TablesDB,
} from "node-appwrite"
import type {
  ForgeConfig,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
} from "./types.js"

export const PROJECT_HAS_TICKETS_MESSAGE =
  "Cannot delete a project that still has tickets. Delete its tickets first."

type ProjectRow = Models.DefaultRow & {
  name?: unknown
  description?: unknown
  userId?: unknown
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid project row: ${field} must be a string.`)
  }
  return value
}

export function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.$id,
    name: asString(row.name, "name"),
    description: asString(row.description, "description"),
    createdAt: row.$createdAt,
  }
}

function assertOwnedByUser(row: ProjectRow, userId: string): void {
  if (row.userId !== userId) {
    throw new Error("Project not found.")
  }
}

function formatAppwriteError(error: unknown, fallback: string): Error {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const code =
      "code" in error ? (error as { code: unknown }).code : undefined
    if (code === 404) {
      return new Error("Project not found.")
    }
    return new Error((error as { message: string }).message)
  }
  return new Error(fallback)
}

function privatePermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

export type ProjectsServiceDeps = {
  tablesDB: TablesDB
  config: ForgeConfig
  userId: string
}

export function createProjectsService(deps: ProjectsServiceDeps) {
  const { tablesDB, config, userId } = deps
  const databaseId = config.databaseId
  const tableId = config.devBoardProjectsTableId
  const ticketsTableId = config.devBoardTicketsTableId

  async function getOwnedRow(id: string): Promise<ProjectRow> {
    try {
      const row = await tablesDB.getRow<ProjectRow>({
        databaseId,
        tableId,
        rowId: id,
      })
      assertOwnedByUser(row, userId)
      return row
    } catch (error) {
      throw formatAppwriteError(error, "Failed to get project.")
    }
  }

  async function countTicketsForProject(projectId: string): Promise<number> {
    const response = await tablesDB.listRows({
      databaseId,
      tableId: ticketsTableId,
      queries: [
        Query.equal("userId", userId),
        Query.equal("projectId", projectId),
        Query.limit(1),
      ],
    })
    return response.total
  }

  return {
    async list(): Promise<Project[]> {
      try {
        const response = await tablesDB.listRows<ProjectRow>({
          databaseId,
          tableId,
          queries: [
            Query.equal("userId", userId),
            Query.orderDesc("$createdAt"),
          ],
        })
        return response.rows.map(mapRowToProject)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to list projects.")
      }
    },

    async get(id: string): Promise<Project> {
      const row = await getOwnedRow(id)
      return mapRowToProject(row)
    },

    async create(input: ProjectCreateInput): Promise<Project> {
      try {
        const row = await tablesDB.createRow<ProjectRow>({
          databaseId,
          tableId,
          rowId: ID.unique(),
          data: {
            userId,
            name: input.name,
            description: input.description,
          },
          permissions: privatePermissions(userId),
        })
        return mapRowToProject(row)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to create project.")
      }
    },

    async update(id: string, input: ProjectUpdateInput): Promise<Project> {
      const data: Record<string, string> = {}
      if (input.name !== undefined) data.name = input.name
      if (input.description !== undefined) data.description = input.description

      if (Object.keys(data).length === 0) {
        throw new Error("Nothing to update. Provide at least one field.")
      }

      await getOwnedRow(id)

      try {
        const row = await tablesDB.updateRow<ProjectRow>({
          databaseId,
          tableId,
          rowId: id,
          data,
        })
        return mapRowToProject(row)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to update project.")
      }
    },

    async delete(id: string): Promise<void> {
      await getOwnedRow(id)

      // Count immediately before delete to reduce races with concurrent ticket creates.
      const ticketCount = await countTicketsForProject(id)
      if (ticketCount > 0) {
        throw new Error(PROJECT_HAS_TICKETS_MESSAGE)
      }

      try {
        await tablesDB.deleteRow({
          databaseId,
          tableId,
          rowId: id,
        })
      } catch (error) {
        throw formatAppwriteError(error, "Failed to delete project.")
      }
    },
  }
}

export type ProjectsService = ReturnType<typeof createProjectsService>
