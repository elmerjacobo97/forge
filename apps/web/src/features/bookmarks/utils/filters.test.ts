import { describe, expect, it } from "vitest";

import type { Bookmark } from "../types";
import { filterBookmarks } from "./filters";

const bookmarks: Bookmark[] = [
  {
    id: "1",
    title: "React Docs",
    url: "https://react.dev",
    category: "docs",
    description: "Official React documentation",
    tags: ["react"],
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "2",
    title: "Engram",
    url: "https://github.com/Gentleman-Programming/engram",
    category: "git",
    description: "Persistent memory system for coding agents",
    tags: ["memory"],
    createdAt: "2026-07-21T00:00:00.000Z",
  },
];

describe("filterBookmarks", () => {
  it("returns everything with empty filters", () => {
    expect(filterBookmarks(bookmarks, { q: "", category: "all" })).toEqual(bookmarks);
  });

  it("matches title case-insensitively", () => {
    expect(filterBookmarks(bookmarks, { q: "react", category: "all" })).toEqual([bookmarks[0]]);
  });

  it("filters by category", () => {
    expect(filterBookmarks(bookmarks, { q: "", category: "git" })).toEqual([bookmarks[1]]);
  });

  it("combines search and category filters", () => {
    expect(filterBookmarks(bookmarks, { q: "engram", category: "docs" })).toEqual([]);
  });
});
