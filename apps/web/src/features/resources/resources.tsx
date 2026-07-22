"use client";

import { useMemo, useState } from "react";
import { Code2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AddResourceDialog } from "./components/add-resource-dialog";
import { EditResourceDialog } from "./components/edit-resource-dialog";
import { ResourceCard } from "./components/resource-card";
import { useDeleteResourceMutation } from "./hooks/mutations";
import { useResourcesQuery } from "./hooks/queries";
import { FORMATS, KINDS, TOOLS } from "./constants";
import type { Resource, ResourceFormat, ResourceKind, ResourceTool } from "./types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function Resources() {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [selectedKind, setSelectedKind] = useState<ResourceKind | "all">("all");
  const [selectedTool, setSelectedTool] = useState<ResourceTool | "all">("all");
  const [selectedFormat, setSelectedFormat] = useState<ResourceFormat | "all">("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const debouncedSearch = useDebounce(search, 200);
  const { data: resources = [], isLoading, isError, error } = useResourcesQuery();
  const deleteMutation = useDeleteResourceMutation();
  const tags = useMemo(
    () =>
      Array.from(new Set(resources.flatMap((resource) => resource.tags))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [resources],
  );

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSearch =
        !q ||
        resource.title.toLowerCase().includes(q) ||
        resource.content.toLowerCase().includes(q) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesKind = selectedKind === "all" || resource.kind === selectedKind;
      const matchesTool = selectedTool === "all" || resource.tool === selectedTool;
      const isKnownFormat = resource.language
        ? FORMATS.some((format) => format.value === resource.language?.toLowerCase())
        : false;
      const matchesFormat =
        selectedFormat === "all" ||
        (selectedFormat === "other"
          ? resource.language === "other" || (resource.language !== null && !isKnownFormat)
          : resource.language?.toLowerCase() === selectedFormat);
      const matchesTag = selectedTag === "all" || resource.tags.includes(selectedTag);
      return matchesSearch && matchesKind && matchesTool && matchesFormat && matchesTag;
    });
  }, [resources, debouncedSearch, selectedKind, selectedTool, selectedFormat, selectedTag]);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="h-8 pl-8 text-xs"
            type="search"
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
                onClick={() => setSelectedKind(kind.value)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  selectedKind === kind.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {kind.label}
              </button>
            ))}
          </div>

          <Select
            value={selectedTool}
            onValueChange={(value) => setSelectedTool(value as ResourceTool | "all")}
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
            value={selectedFormat}
            onValueChange={(value) => setSelectedFormat(value as ResourceFormat | "all")}
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
            value={selectedTag}
            onValueChange={setSelectedTag}
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-border bg-card p-4 h-45 animate-pulse"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 w-full">
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="mt-4 flex-1 space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Code2 className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No resources found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new resource.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={setEditingResource}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <AddResourceDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {editingResource ? (
        <EditResourceDialog
          key={editingResource.id}
          resource={editingResource}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditingResource(null);
          }}
        />
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete resource?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `“${deleteTarget.title}” will be permanently removed.` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
