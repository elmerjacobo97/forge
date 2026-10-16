import { projectsService } from "@/features/dev-board/services/projects-service";
import { Notes } from "@/features/notes/notes";
import { parseNoteFilters } from "@/features/notes/schemas/note-filters";
import { notesService } from "@/features/notes/services/notes-service";
import { parseVisibleParam } from "@/lib/pagination";

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const params = await searchParams;
  const filters = parseNoteFilters(params);
  const visible = parseVisibleParam(params.visible);
  const [{ notes, tags, total }, projects] = await Promise.all([
    notesService.fetchNotesPage(filters, visible),
    projectsService.listProjects(),
  ]);

  return (
    <Notes
      notes={notes}
      filters={filters}
      tags={tags}
      projects={projects.map(({ id, name }) => ({ id, name }))}
      total={total}
    />
  );
}
