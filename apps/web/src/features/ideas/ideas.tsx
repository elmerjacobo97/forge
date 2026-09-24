import { HugeiconsIcon } from "@hugeicons/react";
import { Idea01Icon } from "@hugeicons/core-free-icons";

import { ListPagination } from "@/components/list-pagination";
import { IdeaRow } from "./components/idea-row";
import { IdeasToolbar } from "./components/ideas-toolbar";
import type { IdeaFilters } from "./schemas/idea-filters";
import type { Idea } from "./types";

export function Ideas({
  ideas,
  filters,
  tags,
  total,
}: {
  ideas: Idea[];
  filters: IdeaFilters;
  tags: string[];
  total: number;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="font-heading text-lg font-medium tracking-tight">Ideas</h1>
        <p className="text-xs text-muted-foreground">
          Capture and track product, app, and business ideas.
        </p>
      </div>

      <IdeasToolbar
        filters={filters}
        tags={tags}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {ideas.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <HugeiconsIcon
              icon={Idea01Icon}
              strokeWidth={2}
              className="size-8 text-muted-foreground/40"
            />
            <p className="text-sm font-medium">No ideas found</p>
            <p className="text-xs text-muted-foreground">Refine your search or add a new idea.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border bg-card">
            {ideas.map((idea) => (
              <IdeaRow
                key={idea.id}
                idea={idea}
              />
            ))}
          </div>
        )}
      </div>

      <ListPagination
        loaded={ideas.length}
        total={total}
      />
    </div>
  );
}
