import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { projectsService } from "./projects-service";

const projectRow = {
  id: "project-1",
  name: "Forge",
  description: "Dev tools",
  status: "in_progress",
  created_at: "2026-09-23T00:00:00.000Z",
};

function createQueryMock(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (value: typeof result) => unknown) => unknown;
  } = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    single: vi.fn(),
  };
  for (const method of ["select", "order", "eq", "insert", "update"]) {
    query[method].mockReturnValue(query);
  }
  query.single.mockResolvedValue(result);
  query.then = (resolve) => Promise.resolve(result).then(resolve);
  return query;
}

beforeEach(() => vi.clearAllMocks());

describe("projectsService", () => {
  it("reads and maps persisted project status", async () => {
    const query = createQueryMock({ data: projectRow, error: null });
    database.from.mockReturnValue(query);

    await expect(projectsService.getProject(projectRow.id)).resolves.toEqual({
      id: projectRow.id,
      name: projectRow.name,
      description: projectRow.description,
      status: "in_progress",
      createdAt: projectRow.created_at,
    });
    expect(database.from).toHaveBeenCalledWith("dev_board_projects");
    expect(query.select).toHaveBeenCalledWith("id,name,description,status,created_at");
  });

  it("persists status when creating a project", async () => {
    const query = createQueryMock({ data: projectRow, error: null });
    database.from.mockReturnValue(query);

    await expect(
      projectsService.createProject({
        name: "Forge",
        description: "Dev tools",
        status: "in_progress",
      }),
    ).resolves.toMatchObject({ status: "in_progress" });
    expect(query.insert).toHaveBeenCalledWith([
      { name: "Forge", description: "Dev tools", status: "in_progress" },
    ]);
    expect(query.select).toHaveBeenCalledWith("id,name,description,status,created_at");
  });

  it("persists status changes when updating a project", async () => {
    const query = createQueryMock({ data: { ...projectRow, status: "paused" }, error: null });
    database.from.mockReturnValue(query);

    await expect(
      projectsService.updateProject(projectRow.id, { status: "paused" }),
    ).resolves.toMatchObject({ status: "paused" });
    expect(query.update).toHaveBeenCalledWith({ status: "paused" });
    expect(query.eq).toHaveBeenCalledWith("id", projectRow.id);
  });
});
