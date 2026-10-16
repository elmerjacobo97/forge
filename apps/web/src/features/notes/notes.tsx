import { HugeiconsIcon } from "@hugeicons/react";
import { Note01Icon } from "@hugeicons/core-free-icons";

import { ListPagination } from "@/components/list-pagination";
import { NoteRow } from "./components/note-row";
import { NotesToolbar } from "./components/notes-toolbar";
import type { NoteFilters } from "./schemas/note-filters";
import type { Note, NoteProject } from "./types";

export function Notes({
  notes,
  filters,
  tags,
  projects,
  total,
}: {
  notes: Note[];
  filters: NoteFilters;
  tags: string[];
  projects: NoteProject[];
  total: number;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="font-heading text-lg font-medium tracking-tight">Notes</h1>
        <p className="text-xs text-muted-foreground">
          Personal knowledge base: fixes, configs, and decisions worth keeping.
        </p>
      </div>

      <NotesToolbar
        filters={filters}
        tags={tags}
        projects={projects}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <HugeiconsIcon
              icon={Note01Icon}
              strokeWidth={2}
              className="size-8 text-muted-foreground/40"
            />
            <p className="text-sm font-medium">No notes found</p>
            <p className="text-xs text-muted-foreground">Refine your search or add a new note.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border bg-card">
            {notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                projects={projects}
              />
            ))}
          </div>
        )}
      </div>

      <ListPagination
        loaded={notes.length}
        total={total}
      />
    </div>
  );
}
