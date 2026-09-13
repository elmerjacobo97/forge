"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddResourceDialog } from "./add-resource-dialog";
import { FORMATS, KINDS, TOOLS } from "../constants";
import type { ResourceFilters } from "../schemas/resource-filters";
import type { ResourceFormat, ResourceTool } from "../types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

function buildQuery(filters: ResourceFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.kind !== "all") params.set("kind", filters.kind);
  if (filters.tool !== "all") params.set("tool", filters.tool);
  if (filters.format !== "all") params.set("format", filters.format);
  if (filters.tag !== "all") params.set("tag", filters.tag);
  return params.toString();
}

export function ResourcesToolbar({ filters, tags }: { filters: ResourceFilters; tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.q);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNavigating, startNavigating] = useTransition();
  const debouncedSearch = useDebounce(search, 200);
  const lastSyncedQuery = useRef(filters.q);
  const pendingQueries = useRef(new Set<string>());
  const skipNextPush = useRef(false);

  // Adopt URL changes that we did not push ourselves (back/forward, links).
  useEffect(() => {
    if (filters.q === lastSyncedQuery.current) {
      pendingQueries.current.delete(filters.q);
      return;
    }

    if (pendingQueries.current.has(filters.q)) {
      pendingQueries.current.delete(filters.q);
      return;
    }

    for (const pending of pendingQueries.current) {
      if (pending.trim() === filters.q) {
        pendingQueries.current.delete(pending);
        return;
      }
    }

    skipNextPush.current = true;
    lastSyncedQuery.current = filters.q;
    setSearch(filters.q);
  }, [filters.q]);

  const applyFilters = useCallback(
    (next: Partial<ResourceFilters>) => {
      const query = buildQuery({ ...filters, ...next });
      startNavigating(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [filters, pathname, router],
  );

  useEffect(() => {
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    if (debouncedSearch !== search) return;
    if (debouncedSearch === filters.q) return;
    if (debouncedSearch === lastSyncedQuery.current) return;
    pendingQueries.current.add(debouncedSearch);
    lastSyncedQuery.current = debouncedSearch;
    applyFilters({ q: debouncedSearch });
  }, [search, debouncedSearch, filters.q, applyFilters]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search resources…"
          className="h-8 pl-8 text-xs"
          type="search"
          aria-busy={isNavigating}
        />
      </div>

      <Button
        size="sm"
        onClick={() => setIsAddDialogOpen(true)}
        className="ml-auto"
      >
        <Plus className="size-3.5" />
        Add resource
      </Button>

      <div className="flex w-full flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {KINDS.map((kind) => (
            <button
              key={kind.value}
              type="button"
              onClick={() => applyFilters({ kind: kind.value })}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                filters.kind === kind.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {kind.label}
            </button>
          ))}
        </div>

        <Select
          value={filters.tool}
          onValueChange={(value) => applyFilters({ tool: value as ResourceTool | "all" })}
        >
          <SelectTrigger
            size="sm"
            className="min-w-32"
            aria-label="Filter by tool"
          >
            <SelectValue placeholder="Tool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tools</SelectItem>
            {TOOLS.map((tool) => (
              <SelectItem
                key={tool.value}
                value={tool.value}
              >
                {tool.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.format}
          onValueChange={(value) => applyFilters({ format: value as ResourceFormat | "all" })}
        >
          <SelectTrigger
            size="sm"
            className="min-w-32"
            aria-label="Filter by format"
          >
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            {FORMATS.map((format) => (
              <SelectItem
                key={format.value}
                value={format.value}
              >
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.tag}
          onValueChange={(value) => applyFilters({ tag: value })}
        >
          <SelectTrigger
            size="sm"
            className="min-w-32"
            aria-label="Filter by tag"
          >
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem
                key={tag}
                value={tag}
              >
                #{tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AddResourceDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
