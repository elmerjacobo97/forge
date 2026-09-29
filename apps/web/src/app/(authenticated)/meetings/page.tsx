import { MeetingsHistory } from "@/features/meetings/components/meetings-history";
import { parseMeetingFilters } from "@/features/meetings/schemas/meeting";
import { meetingsService } from "@/features/meetings/services/meetings-service";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { parseVisibleParam } from "@/lib/pagination";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseMeetingFilters(params);
  const visible = parseVisibleParam(params.visible);
  const [page, projects] = await Promise.all([
    meetingsService.fetchMeetingsPage(filters, 0, visible),
    projectsService.listProjects(),
  ]);

  return (
    <MeetingsHistory
      page={page}
      filters={filters}
      projects={projects}
    />
  );
}
