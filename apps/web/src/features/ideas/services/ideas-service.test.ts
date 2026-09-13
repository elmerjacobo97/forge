import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { buildIdeaSearchFilter } from "../utils/query-filters";
import { ideasService } from "./ideas-service";

const filters = {
  q: "",
  status: "all",
  category: "all",
  tag: "all",
} as const;

function mockFetchQueries(
  mainResult: { data: unknown; error: unknown; count?: number | null },
  tagRows: unknown,
) {
  const range = vi.fn().mockResolvedValue(mainResult);
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    contains: vi.fn(),
    order: vi.fn(),
    range,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.contains.mockReturnValue(query);
  query.order.mockReturnValue(query);

  const tagsSelect = vi.fn().mockResolvedValue({ data: tagRows, error: null });
  database.from.mockReturnValueOnce(query).mockReturnValueOnce({ select: tagsSelect });

  return query;
}

describe("ideasService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps rows with tags and links", async () => {
    const row = {
      id: "idea-1",
      title: "Coffee meetup app",
      content: "Join strangers for coffee.",
      status: "exploring",
      category: "mobile",
      tags: ["social"],
      links: ["https://example.com/inspiration"],
      created_at: "2026-09-01T00:00:00.000Z",
    };
    mockFetchQueries({ data: [row], error: null, count: 1 }, [{ tags: ["social"] }]);

    const page = await ideasService.fetchIdeasPage(filters, 10);

    expect(page.ideas).toEqual([
      {
        id: row.id,
        title: row.title,
        content: row.content,
        status: row.status,
        category: row.category,
        tags: row.tags,
        links: row.links,
        createdAt: row.created_at,
      },
    ]);
    expect(page.tags).toEqual(["social"]);
    expect(page.total).toBe(1);
  });

  it("maps rows with empty tags and links", async () => {
    const row = {
      id: "idea-2",
      title: "Quick spark",
      content: "content",
      status: "seed",
      category: "other",
      tags: [],
      links: [],
      created_at: "2026-09-01T01:00:00.000Z",
    };
    mockFetchQueries({ data: [row], error: null, count: 1 }, []);

    const page = await ideasService.fetchIdeasPage(filters, 10);

    expect(page.ideas[0]).toMatchObject({ tags: [], links: [] });
    expect(page.tags).toEqual([]);
  });

  it("applies the visible parameter, exact count and stable order", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await ideasService.fetchIdeasPage(filters, 25);

    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("id,title"), {
      count: "exact",
    });
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(query.range).toHaveBeenCalledWith(0, 24);
  });

  it("applies status, category and tag filters server-side", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await ideasService.fetchIdeasPage(
      { q: "", status: "building", category: "mobile", tag: "social" },
      10,
    );

    expect(query.eq).toHaveBeenCalledWith("status", "building");
    expect(query.eq).toHaveBeenCalledWith("category", "mobile");
    expect(query.contains).toHaveBeenCalledWith("tags", ["social"]);
    expect(query.or).not.toHaveBeenCalled();
  });

  it("builds the search filter from the trimmed query", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await ideasService.fetchIdeasPage({ ...filters, q: "  coffee  " }, 10);

    expect(query.or).toHaveBeenCalledWith(buildIdeaSearchFilter("coffee"));
  });

  it("defaults the total to 0 when count is null", async () => {
    mockFetchQueries({ data: [], error: null, count: null }, []);

    await expect(ideasService.fetchIdeasPage(filters, 10)).resolves.toMatchObject({ total: 0 });
  });

  it("throws when InsForge returns an error", async () => {
    mockFetchQueries({ data: null, error: { message: "boom" }, count: null }, []);

    await expect(ideasService.fetchIdeasPage(filters, 10)).rejects.toThrow("boom");
  });

  it("persists an idea with snake_case columns", async () => {
    const row = {
      id: "idea-3",
      title: "Coffee meetup app",
      content: "Join strangers for coffee.",
      status: "seed",
      category: "other",
      tags: ["social"],
      links: [],
      created_at: "2026-09-01T02:00:00.000Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    database.from.mockReturnValue({ insert });

    const input = {
      title: row.title,
      content: row.content,
      status: "seed" as const,
      category: "other" as const,
      tags: row.tags,
      links: row.links,
    };

    await expect(ideasService.createIdea(input)).resolves.toEqual({
      id: row.id,
      title: row.title,
      content: row.content,
      status: row.status,
      category: row.category,
      tags: row.tags,
      links: row.links,
      createdAt: row.created_at,
    });
    expect(insert).toHaveBeenCalledWith([
      {
        title: input.title,
        content: input.content,
        status: input.status,
        category: input.category,
        tags: input.tags,
        links: input.links,
      },
    ]);
  });

  it("updates an idea by id", async () => {
    const row = {
      id: "idea-4",
      title: "Coffee meetup app",
      content: "Join strangers for coffee.",
      status: "building",
      category: "mobile",
      tags: ["social", "local"],
      links: ["https://example.com/inspiration"],
      created_at: "2026-09-01T03:00:00.000Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    database.from.mockReturnValue({ update });

    const input = {
      title: row.title,
      content: row.content,
      status: "building" as const,
      category: "mobile" as const,
      tags: row.tags,
      links: row.links,
    };

    await expect(ideasService.updateIdea(row.id, input)).resolves.toMatchObject({
      id: row.id,
      status: "building",
      links: row.links,
    });
    expect(update).toHaveBeenCalledWith({
      title: input.title,
      content: input.content,
      status: input.status,
      category: input.category,
      tags: input.tags,
      links: input.links,
    });
    expect(eq).toHaveBeenCalledWith("id", row.id);
  });

  it("deletes an idea by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn(() => ({ eq }));
    database.from.mockReturnValue({ delete: remove });

    await expect(ideasService.deleteIdea("idea-5")).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "idea-5");
  });
});
