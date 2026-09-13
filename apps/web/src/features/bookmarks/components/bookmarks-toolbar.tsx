"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddBookmarkDialog } from "@/features/bookmarks/components/add-bookmark-dialog";
import { CATEGORIES } from "@/features/bookmarks/constants";
import type { BookmarkFilters } from "@/features/bookmarks/schemas/bookmarks-schema";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

function buildQuery(filters: BookmarkFilters): string {
  const params = new URLSearchParams();
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

export function BookmarksToolbar({ filters }: { filters: BookmarkFilters }) {
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
    (next: Partial<BookmarkFilters>) => {
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
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search bookmarks..."
          className="h-8 pl-8 text-xs"
          type="search"
          aria-busy={isNavigating}
        />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => applyFilters({ category: category.value })}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              filters.category === category.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <Button
        size="sm"
        onClick={() => setIsAddDialogOpen(true)}
        className="ml-auto"
      >
        <Plus className="size-3.5" />
        Add
      </Button>

      <AddBookmarkDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
