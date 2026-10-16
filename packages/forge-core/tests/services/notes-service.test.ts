import type { InsForgeClient } from "@insforge/sdk";
import { describe, expect, it, vi } from "vitest";
import { createNotesService, mapRowToNote } from "../../src/notes-service.js";

const row = {
  id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  title: "Expo SDK 52",
  content: "Use `expo-router` v4.",
  tags: ["expo"],
  project_id: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-02T00:00:00.000Z",
};

const note = {
  id: row.id,
  title: row.title,
  content: row.content,
  tags: row.tags,
  projectId: null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
};

function createNotesClient(data: unknown) {
  const response = { data, error: null };
  const query = {
    eq: vi.fn(),
    contains: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(response).then(resolve),
  };
  for (const key of ["eq", "contains", "or", "order", "range", "update", "select"] as const) {
    query[key].mockReturnValue(query);
  }
  const from = vi.fn(() => query);
  return { client: { database: { from } } as unknown as InsForgeClient, from, query };
}

describe("mapRowToNote", () => {
  it("maps a row to the shared shape", () => {
    expect(mapRowToNote(row)).toEqual(note);
  });

  it("keeps a linked project id", () => {
    expect(mapRowToNote({ ...row, project_id: "p-1" }).projectId).toBe("p-1");
  });

  it("rejects malformed rows", () => {
    expect(() => mapRowToNote({ ...row, tags: "expo" })).toThrow(/tags must be a string array/);
    expect(() => mapRowToNote({ ...row, project_id: 3 })).toThrow(/project_id must be a string/);
  });
});

describe("notesService.list", () => {
  it("reads the notes table without filters", async () => {
    const { client, from, query } = createNotesClient([row]);

    await expect(createNotesService({ client }).list()).resolves.toEqual([note]);
    expect(from).toHaveBeenCalledWith("notes");
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.or).not.toHaveBeenCalled();
    expect(query.range).not.toHaveBeenCalled();
  });

  it("applies limit and offset", async () => {
    const { client, query } = createNotesClient([row]);

    await createNotesService({ client }).list({ limit: 10, offset: 10 });

    expect(query.range).toHaveBeenCalledWith(10, 19);
  });

  it("filters by project and lowercased tag", async () => {
    const { client, query } = createNotesClient([row]);

    await createNotesService({ client }).list({ projectId: "p-1", tag: "RN-0.76" });

    expect(query.eq).toHaveBeenCalledWith("project_id", "p-1");
    expect(query.contains).toHaveBeenCalledWith("tags", ["rn-0.76"]);
  });

  it("searches title, content and tags with escaped pattern", async () => {
    const { client, query } = createNotesClient([row]);

    await createNotesService({ client }).list({ q: "50%_Off" });

    expect(query.or).toHaveBeenCalledWith(
      'title.ilike."%50\\\\%\\\\_Off%",content.ilike."%50\\\\%\\\\_Off%",tags.cs.{"50%_off"}',
    );
  });
});

describe("notesService.update", () => {
  it("rejects an update without fields", async () => {
    const { client } = createNotesClient([]);

    await expect(createNotesService({ client }).update(row.id, {})).rejects.toThrow(
      /Nothing to update/,
    );
  });

  it("reports a missing note", async () => {
    const { client } = createNotesClient([]);

    await expect(createNotesService({ client }).get(row.id)).rejects.toThrow("Note not found.");
  });
});
