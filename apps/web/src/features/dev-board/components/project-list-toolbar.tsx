"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "../types/project";
import type { ProjectFilters } from "../schemas/project-filters";

const SORT_OPTIONS = [
  { value: "status", label: "Default order" },
  { value: "name", label: "Name (A–Z)" },
  { value: "created", label: "Newest first" },
] as const;

function buildProjectListQuery(filters: ProjectFilters): string {
  const params = new URLSearchParams();
  const query = filters.q.trim();

  if (query) params.set("q", query);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "status") params.set("sort", filters.sort);

  return params.toString();
}

export function ProjectListToolbar({ filters }: { filters: ProjectFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigating] = useTransition();

  const applyFilters = useCallback(
    (next: Partial<ProjectFilters>) => {
      const query = buildProjectListQuery({ ...filters, ...next });
      startNavigating(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [filters, pathname, router],
  );

  const { value: search, setValue: setSearch } = useUrlSearch(filters.q, (q) =>
    applyFilters({ q }),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1 sm:max-w-sm">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects…"
          className="pl-8"
          aria-label="Search projects"
          aria-busy={isNavigating}
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(value) => applyFilters({ status: value as ProjectFilters["status"] })}
      >
        <SelectTrigger
          className="min-w-36"
          aria-label="Filter by project status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All active</SelectItem>
          {PROJECT_STATUSES.map((status) => (
            <SelectItem
              key={status}
              value={status}
            >
              {PROJECT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(value) => applyFilters({ sort: value as ProjectFilters["sort"] })}
      >
        <SelectTrigger
          className="min-w-36"
          aria-label="Sort projects"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.q || filters.status !== "all" || filters.sort !== "status" ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          onClick={() => applyFilters({ q: "", status: "all", sort: "status" })}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="size-3"
          />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
