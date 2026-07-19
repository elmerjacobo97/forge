import { ID, Permission, Query, Role } from "appwrite";

import { tablesDB } from "@/lib/appwrite";

import type { Project, ProjectCreateInput, ProjectUpdateInput } from "../types/project";
import { assertProjectHasNoTickets } from "../utils/project-delete";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const projectsTableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID;
const ticketsTableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID;

export interface ProjectRow {
  $id: string;
  $createdAt: string;
  userId: string;
  name: string;
  description: string;
}

function assertConfigured(): void {
  if (!databaseId || !projectsTableId || !ticketsTableId) {
    throw new Error("Dev Board storage is not configured.");
  }
}

function privatePermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

export function toProject(row: ProjectRow): Project {
  return {
    id: row.$id,
    name: row.name,
    description: row.description,
    createdAt: row.$createdAt,
  };
}

async function requireOwnedProject(projectId: string, userId: string): Promise<ProjectRow> {
  const row = (await tablesDB.getRow({
    databaseId,
    tableId: projectsTableId,
    rowId: projectId,
  })) as unknown as ProjectRow;

  if (row.userId !== userId) {
    throw new Error("Project not found.");
  }

  return row;
}

async function countTicketsForProject(projectId: string, userId: string): Promise<number> {
  const response = await tablesDB.listRows({
    databaseId,
    tableId: ticketsTableId,
    queries: [
      Query.equal("userId", userId),
      Query.equal("projectId", projectId),
      Query.limit(1),
    ],
  });
  return response.total;
}

export const projectsService = {
  async listProjects(userId: string): Promise<Project[]> {
    assertConfigured();
    const response = await tablesDB.listRows({
      databaseId,
      tableId: projectsTableId,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    });
    return (response.rows as unknown as ProjectRow[]).map(toProject);
  },

  async getProject(projectId: string, userId: string): Promise<Project> {
    assertConfigured();
    return toProject(await requireOwnedProject(projectId, userId));
  },

  async createProject(input: ProjectCreateInput, userId: string): Promise<Project> {
    assertConfigured();
    const row = (await tablesDB.createRow({
      databaseId,
      tableId: projectsTableId,
      rowId: ID.unique(),
      data: {
        userId,
        name: input.name,
        description: input.description,
      },
      permissions: privatePermissions(userId),
    })) as unknown as ProjectRow;

    return toProject(row);
  },

  async updateProject(
    projectId: string,
    input: ProjectUpdateInput,
    userId: string,
  ): Promise<Project> {
    assertConfigured();
    await requireOwnedProject(projectId, userId);

    const data: Record<string, string> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;

    const row = (await tablesDB.updateRow({
      databaseId,
      tableId: projectsTableId,
      rowId: projectId,
      data,
    })) as unknown as ProjectRow;

    return toProject(row);
  },

  async deleteProject(projectId: string, userId: string): Promise<void> {
    assertConfigured();
    await requireOwnedProject(projectId, userId);
    // Count immediately before delete to reduce races with concurrent ticket creates.
    assertProjectHasNoTickets(await countTicketsForProject(projectId, userId));

    await tablesDB.deleteRow({
      databaseId,
      tableId: projectsTableId,
      rowId: projectId,
    });
  },
};
