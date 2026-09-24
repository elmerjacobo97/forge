"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddResourceDialog } from "@/features/resources/components/add-resource-dialog";
import { CATEGORIES } from "@/features/resources/constants";
import type { ResourceFilters } from "@/features/resources/schemas/resources-schema";
import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { cn } from "@/lib/utils";

function buildQuery(filters: ResourceFilters): string {
  const params = new URLSearchParams();
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

export function ResourcesToolbar({ filters }: { filters: ResourceFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNavigating, startNavigating] = useTransition();

  const applyFilters = useCallback(
    (next: Partial<ResourceFilters>) => {
      const query = buildQuery({ ...filters, ...next });
      startNavigating(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [filters, pathname, router],
  );

  const { value: search, setValue: setSearch } = useUrlSearch(filters.q, (q) =>
    applyFilters({ q }),
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search resources..."
          className="pl-8"
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

      <AddResourceDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
