import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const appwrite = vi.hoisted(() => ({
  createRow: vi.fn(),
  deleteRow: vi.fn(),
  equal: vi.fn((field: string, value: string) => `equal:${field}:${value}`),
  orderDesc: vi.fn((field: string) => `orderDesc:${field}`),
  unique: vi.fn(() => "generated-bookmark-id"),
  read: vi.fn((role: string) => `read:${role}`),
  update: vi.fn((role: string) => `update:${role}`),
  delete: vi.fn((role: string) => `delete:${role}`),
  user: vi.fn((userId: string) => `user:${userId}`),
}));

vi.mock("@/lib/appwrite", () => ({
  tablesDB: {
    listRows: vi.fn(),
    createRow: appwrite.createRow,
    deleteRow: appwrite.deleteRow,
  },
}));

vi.mock("appwrite", () => ({
  Query: {
    equal: appwrite.equal,
    orderDesc: appwrite.orderDesc,
  },
  ID: { unique: appwrite.unique },
  Permission: {
    read: appwrite.read,
    update: appwrite.update,
    delete: appwrite.delete,
  },
  Role: { user: appwrite.user },
}));

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

async function loadService(configured = true) {
  vi.resetModules();
  vi.stubEnv("VITE_APPWRITE_DATABASE_ID", configured ? "database-id" : "");
  vi.stubEnv("VITE_APPWRITE_BOOKMARKS_COLLECTION_ID", configured ? "bookmarks-table-id" : "");
  return (await import("./bookmarks-service")).bookmarksService;
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => {
      throw new Error("Bookmarks must not use localStorage.");
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

describe("bookmarksService", () => {
  it("rejects requests without a signed-in user", async () => {
    const service = await loadService();

    await expect(service.fetchBookmarks()).rejects.toThrow("Sign in to use Bookmarks.");
  });

  it("rejects requests when Appwrite storage is not configured", async () => {
    const service = await loadService(false);

    await expect(service.fetchBookmarks("user-1")).rejects.toThrow(
      "Bookmarks storage is not configured.",
    );
  });

  it("lists user bookmarks from Appwrite without a local fallback", async () => {
    const { tablesDB } = await import("@/lib/appwrite");
    vi.mocked(tablesDB.listRows).mockResolvedValue({
      rows: [{
        $id: "bookmark-1",
        $createdAt: "2026-07-12T10:00:00.000Z",
        title: "Vitest",
        url: "https://vitest.dev",
        category: "docs",
        description: "Test framework documentation",
        tags: ["testing"],
      }],
    } as never);
    const service = await loadService();

    await expect(service.fetchBookmarks("user-1")).resolves.toEqual([
      {
        id: "bookmark-1",
        createdAt: "2026-07-12T10:00:00.000Z",
        title: "Vitest",
        url: "https://vitest.dev",
        category: "docs",
        description: "Test framework documentation",
        tags: ["testing"],
      },
    ]);
    expect(tablesDB.listRows).toHaveBeenCalledWith({
      databaseId: "database-id",
      tableId: "bookmarks-table-id",
      queries: ["equal:userId:user-1", "orderDesc:$createdAt"],
    });
  });

  it("creates a bookmark through Appwrite with user-only permissions", async () => {
    appwrite.createRow.mockResolvedValue({
      $id: "bookmark-1",
      $createdAt: "2026-07-12T10:00:00.000Z",
      title: "Vitest",
      url: "https://vitest.dev",
      category: "docs",
      description: "Test framework documentation",
      tags: ["testing"],
    });
    const service = await loadService();
    const bookmark = {
      title: "Vitest",
      url: "https://vitest.dev",
      category: "docs" as const,
      description: "Test framework documentation",
      tags: ["testing"],
    };

    await expect(service.createBookmark(bookmark, "user-1")).resolves.toMatchObject({
      id: "bookmark-1",
      ...bookmark,
    });
    expect(appwrite.createRow).toHaveBeenCalledWith({
      databaseId: "database-id",
      tableId: "bookmarks-table-id",
      rowId: "generated-bookmark-id",
      data: { ...bookmark, userId: "user-1" },
      permissions: ["read:user:user-1", "update:user:user-1", "delete:user:user-1"],
    });
  });

  it("deletes a bookmark through Appwrite", async () => {
    const service = await loadService();

    await expect(service.deleteBookmark("bookmark-1", "user-1")).resolves.toBeUndefined();
    expect(appwrite.deleteRow).toHaveBeenCalledWith({
      databaseId: "database-id",
      tableId: "bookmarks-table-id",
      rowId: "bookmark-1",
    });
  });
});
