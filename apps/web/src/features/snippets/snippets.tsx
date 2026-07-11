import { useMemo, useState } from "react";
import { Code2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { AddSnippetDialog } from "./components/add-snippet-dialog";
import { SnippetCard } from "./components/snippet-card";
import { useSnippetsQuery } from "./hooks/queries";
import { KINDS } from "./constants";
import type { SnippetKind } from "./types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function Snippets() {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState<SnippetKind | "all">("all");

  const debouncedSearch = useDebounce(search, 200);
  const {
    data: snippets = [],
    isLoading,
    isError,
    error,
  } = useSnippetsQuery();

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return snippets.filter((snippet) => {
      const matchesSearch = snippet.title.toLowerCase().includes(q);
      const matchesKind =
        selectedKind === "all" || snippet.kind === selectedKind;
      return matchesSearch && matchesKind;
    });
  }, [snippets, debouncedSearch, selectedKind]);

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
            placeholder="Search snippets…"
            className="h-8 pl-8 text-xs"
            type="search"
          />
        </div>

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

        <Button
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
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
            <Code2 className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No snippets found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new snippet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>
        )}
      </div>

      <AddSnippetDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
