"use client";

import { useMemo, useState } from "react";
import { Globe, Plus, Search } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AddBookmarkDialog } from "@/features/bookmarks/components/add-bookmark-dialog";
import { BookmarkCard } from "@/features/bookmarks/components/bookmark-card";
import { EditBookmarkDialog } from "@/features/bookmarks/components/edit-bookmark-dialog";
import { CATEGORIES } from "@/features/bookmarks/constants";
import { useDeleteBookmarkMutation } from "@/features/bookmarks/hooks/mutations";
import { useBookmarksQuery } from "@/features/bookmarks/hooks/queries";
import type { Bookmark, Category } from "@/features/bookmarks/types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function Bookmarks() {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const debouncedSearch = useDebounce(search, 200);
  const { data: bookmarks = [], isLoading, isError, error } = useBookmarksQuery();
  const deleteMutation = useDeleteBookmarkMutation();

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return bookmarks.filter((bookmark) => {
      const matchesSearch = bookmark.title.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === "all" || bookmark.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [bookmarks, debouncedSearch, selectedCategory]);

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }

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
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search bookmarks..."
            className="h-8 pl-8 text-xs"
            type="search"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                selectedCategory === category.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="ml-auto">
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex h-45 animate-pulse flex-col rounded-xl border border-border bg-card p-4"
              >
                <div className="space-y-2">
                  <div className="h-5 w-16 rounded bg-muted" />
                  <div className="h-6 w-3/4 rounded bg-muted" />
                </div>
                <div className="mt-4 flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Globe className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No bookmarks found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new bookmark.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={setEditingBookmark}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <AddBookmarkDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      {editingBookmark ? (
        <EditBookmarkDialog
          key={editingBookmark.id}
          bookmark={editingBookmark}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditingBookmark(null);
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
            <DialogTitle>Delete bookmark?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
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
