import { describe, expect, it } from "vitest";

import type { Resource } from "../types";
import { filterResources } from "./filters";

const resources: Resource[] = [
  {
    id: "1",
    title: "React Native config",
    kind: "config",
    content: '{"strict":true}',
    language: "json",
    tags: ["mobile", "config"],
    tool: "react-native",
    customTool: null,
    version: "0.75",
    context: "Shared mobile defaults",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "2",
    title: "Deploy notes",
    kind: "note",
    content: "Run migrations before deploy",
    language: null,
    tags: ["ops"],
    tool: null,
    customTool: null,
    version: null,
    context: null,
    createdAt: "2026-07-21T00:00:00.000Z",
  },
  {
    id: "3",
    title: "Legacy config",
    kind: "config",
    content: "enabled=true",
    language: "toml",
    tags: ["ops"],
    tool: "other",
    customTool: "Internal CLI",
    version: "2.0",
    context: null,
    createdAt: "2026-07-22T00:00:00.000Z",
  },
];

const allFilters = { q: "", kind: "all", tool: "all", format: "all", tag: "all" } as const;

describe("filterResources", () => {
  it("returns everything with empty filters", () => {
    expect(filterResources(resources, { ...allFilters })).toEqual(resources);
  });

  it("searches title, content, and tags", () => {
    expect(filterResources(resources, { ...allFilters, q: "migrations" })).toEqual([resources[1]]);
    expect(filterResources(resources, { ...allFilters, q: "ops" })).toEqual([
      resources[1],
      resources[2],
    ]);
  });

  it("filters by kind, tool, and tag", () => {
    expect(filterResources(resources, { ...allFilters, kind: "config" })).toEqual([
      resources[0],
      resources[2],
    ]);
    expect(filterResources(resources, { ...allFilters, tool: "react-native" })).toEqual([
      resources[0],
    ]);
    expect(filterResources(resources, { ...allFilters, tag: "ops" })).toEqual([
      resources[1],
      resources[2],
    ]);
  });

  it("treats unknown languages as the other format", () => {
    expect(filterResources(resources, { ...allFilters, format: "other" })).toEqual([resources[2]]);
    expect(filterResources(resources, { ...allFilters, format: "json" })).toEqual([resources[0]]);
  });
});
