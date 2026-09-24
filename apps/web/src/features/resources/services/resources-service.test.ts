import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { buildResourceSearchFilter } from "../utils/query-filters";
import { resourcesService } from "./resources-service";

const COLUMNS = "id,title,url,category,description,tags,created_at";

const row = {
  id: "resource-1",
  title: "InsForge",
  url: "https://insforge.dev",
  category: "docs",
  description: "Backend documentation",
  tags: ["backend"],
  created_at: "2026-07-20T00:00:00.000Z",
};

const filters = { q: "", category: "all" } as const;

function createQueryMock(result: { data: unknown; error: unknown; count?: number | null }) {
  const range = vi.fn().mockResolvedValue(result);
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  database.from.mockReturnValue(query);
  return query;
}

describe("resourcesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps InsForge rows with the exact count and stable order", async () => {
    const query = createQueryMock({ data: [row], error: null, count: 1 });

    await expect(resourcesService.fetchResources(filters, 10)).resolves.toEqual({
      resources: [
        {
          id: row.id,
          title: row.title,
          url: row.url,
          category: row.category,
          description: row.description,
          tags: row.tags,
          createdAt: row.created_at,
        },
      ],
      total: 1,
    });
    expect(database.from).toHaveBeenCalledWith("resources");
    expect(query.select).toHaveBeenCalledWith(COLUMNS, { count: "exact" });
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(query.range).toHaveBeenCalledWith(0, 9);
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.or).not.toHaveBeenCalled();
  });

  it("applies the visible parameter to the range", async () => {
    const query = createQueryMock({ data: [], error: null, count: 0 });

    await resourcesService.fetchResources(filters, 25);

    expect(query.range).toHaveBeenCalledWith(0, 24);
  });

  it("defaults the total to 0 when count is null", async () => {
    createQueryMock({ data: [row], error: null, count: null });

    await expect(resourcesService.fetchResources(filters, 10)).resolves.toMatchObject({
      total: 0,
    });
  });

  it("applies the category filter server-side", async () => {
    const query = createQueryMock({ data: [], error: null, count: 0 });

    await resourcesService.fetchResources({ q: "", category: "git" }, 10);

    expect(query.eq).toHaveBeenCalledWith("category", "git");
    expect(query.or).not.toHaveBeenCalled();
  });

  it("applies the trimmed search filter server-side", async () => {
    const query = createQueryMock({ data: [], error: null, count: 0 });

    await resourcesService.fetchResources({ q: "  react  ", category: "all" }, 10);

    expect(query.or).toHaveBeenCalledWith(buildResourceSearchFilter("react"));
    expect(query.eq).not.toHaveBeenCalled();
  });

  it("throws when InsForge returns an error", async () => {
    createQueryMock({ data: null, error: { message: "boom" }, count: null });

    await expect(resourcesService.fetchResources(filters, 10)).rejects.toThrow("boom");
  });
});
