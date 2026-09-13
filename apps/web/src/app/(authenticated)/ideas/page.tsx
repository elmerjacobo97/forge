import { Ideas } from "@/features/ideas/ideas";
import { parseIdeaFilters } from "@/features/ideas/schemas/idea-filters";
import { ideasService } from "@/features/ideas/services/ideas-service";
import { parseVisibleParam } from "@/lib/pagination";

export default async function IdeasPage({ searchParams }: PageProps<"/ideas">) {
  const params = await searchParams;
  const filters = parseIdeaFilters(params);
  const visible = parseVisibleParam(params.visible);
  const { ideas, tags, total } = await ideasService.fetchIdeasPage(filters, visible);

  return (
    <Ideas
      ideas={ideas}
      filters={filters}
      tags={tags}
      total={total}
    />
  );
}
