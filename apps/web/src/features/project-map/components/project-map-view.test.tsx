import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({
  deleteProjectFlowAction: vi.fn(),
  deleteProjectModuleAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import type { Project } from "@/features/dev-board/types/project";
import type { MapParams } from "../schemas/map-params";
import type { ProjectMap } from "../types";
import { ProjectMapView } from "./project-map-view";

const project: Project = {
  id: "p-1",
  name: "Forge",
  description: "",
  status: "in_progress",
  createdAt: "2026-10-01T00:00:00.000Z",
};

const map: ProjectMap = {
  modules: [
    { slug: "auth", name: "Auth", description: "", dependsOn: [] },
    { slug: "dev-board", name: "Dev Board", description: "", dependsOn: ["auth", "deleted-one"] },
  ],
  flows: [],
};

const root: MapParams = { moduleSlug: null, flowSlug: null };

function render(viewMap: ProjectMap, params: MapParams) {
  return renderToStaticMarkup(
    <ProjectMapView
      project={project}
      map={viewMap}
      params={params}
      flow={null}
    />,
  );
}

describe("ProjectMapView", () => {
  it("shows the empty state when there are no modules", () => {
    expect(render({ modules: [], flows: [] }, root)).toContain("No map yet");
  });

  it("ignores dependencies on deleted modules", () => {
    const html = render(map, root);

    expect(html).toContain("→ auth");
    expect(html).not.toContain("deleted-one");
  });

  it("explains an unknown module in the query", () => {
    expect(render(map, { moduleSlug: "ghost", flowSlug: null })).toContain(
      "This module does not exist.",
    );
  });

  it("lists the flows of the open module", () => {
    const withFlow: ProjectMap = {
      ...map,
      flows: [{ slug: "login", moduleSlug: "auth", title: "Login", summary: "", stepCount: 3 }],
    };

    const html = render(withFlow, { moduleSlug: "auth", flowSlug: null });

    expect(html).toContain("Login");
    expect(html).toContain("3 steps");
    expect(html).toContain("/dev-board/p-1/flows?module=auth&amp;flow=login");
  });
});
