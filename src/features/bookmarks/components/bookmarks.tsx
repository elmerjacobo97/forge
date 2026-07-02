import { useMemo, useState } from "react";
import { ExternalLink, Globe, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

import { useBookmarksQuery } from "../hooks/queries";
import { useDeleteBookmarkMutation } from "../hooks/mutations";
import { AddBookmarkDialog } from "./add-bookmark-dialog";
import { CATEGORIES } from "../constants";
import { Category } from "../types";

export function Bookmarks() {
  const [search, setSearch] = useState("");
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    "all" as Category,
  );

  const { data: links = [], isLoading, isError, error } = useBookmarksQuery();
  const deleteMutation = useDeleteBookmarkMutation();
  const debouncedSearch = useDebounce(search, 200);

  function deleteBookmark(id: string) {
    deleteMutation.mutate(id);
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return links.filter((link) => {
      const matchesCategory =
        selectedCategory === "all" || link.category === selectedCategory;
      const matchesSearch =
        !q ||
        link.title.toLowerCase().includes(q) ||
        link.description.toLowerCase().includes(q) ||
        link.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [links, debouncedSearch, selectedCategory]);

  // Show alert shadcn ui alert if there is an error
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks…"
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                selectedCategory === cat.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddBookmarkDialogOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
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
            <Globe className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No bookmarks found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new bookmark.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((link) => (
              <div
                key={link.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {link.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-medium leading-snug">
                      {link.title}
                    </h3>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => deleteBookmark(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="mt-3 flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {link.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="text-xs font-mono"
                      >
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    Open
                    <ExternalLink className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bookmark Dialog */}
      <AddBookmarkDialog
        isOpen={isAddBookmarkDialogOpen}
        onOpenChange={setIsAddBookmarkDialogOpen}
      />
    </div>
  );
}
