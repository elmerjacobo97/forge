import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Project } from "@/features/dev-board/types/project";
import { mapHref, type MapParams } from "../schemas/map-params";
import type { ProjectFlow, ProjectMap } from "../types";
import { DeleteMapItemDialog } from "./delete-map-item-dialog";
import { DependencyChips } from "./dependency-chips";
import { FlowSteps } from "./flow-steps";
import { ModuleMap } from "./module-map";

interface ProjectMapViewProps {
  project: Project;
  map: ProjectMap;
  params: MapParams;
  flow: ProjectFlow | null;
}

function Notice({ children, backHref }: { children: string; backHref: string }) {
  return (
    <div className="flex flex-col items-start gap-2 border border-border p-4 text-sm">
      <p>{children}</p>
      <Button
        asChild
        size="sm"
        variant="outline"
      >
        <Link href={backHref}>Back</Link>
      </Button>
    </div>
  );
}

export function ProjectMapView({ project, map, params, flow }: ProjectMapViewProps) {
  const rootHref = mapHref(project.id);
  const currentModule = map.modules.find(
    (item) => item.slug === (flow?.moduleSlug ?? params.moduleSlug),
  );
  const known = new Set(map.modules.map((item) => item.slug));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="-ml-2 mb-1 h-7 px-2 leading-none"
          >
            <Link href={`/dev-board/${project.id}`}>← {project.name}</Link>
          </Button>
          <h1 className="font-heading text-lg font-medium tracking-tight">Flows</h1>
          <p className="text-xs text-muted-foreground">
            {currentModule ? (
              <>
                <Link
                  href={rootHref}
                  className="underline-offset-4 hover:underline"
                >
                  Modules
                </Link>
                {" / "}
                {flow ? (
                  <Link
                    href={mapHref(project.id, { moduleSlug: currentModule.slug })}
                    className="underline-offset-4 hover:underline"
                  >
                    {currentModule.name}
                  </Link>
                ) : (
                  currentModule.name
                )}
                {flow ? ` / ${flow.title}` : ""}
              </>
            ) : (
              "Modules and flows written by your agent."
            )}
          </p>
        </div>
        {flow && currentModule && (
          <DeleteMapItemDialog
            kind="flow"
            projectId={project.id}
            slug={flow.slug}
            name={flow.title}
            redirectHref={mapHref(project.id, { moduleSlug: currentModule.slug })}
          />
        )}
        {!flow && currentModule && (
          <DeleteMapItemDialog
            kind="module"
            projectId={project.id}
            slug={currentModule.slug}
            name={currentModule.name}
            redirectHref={rootHref}
          />
        )}
      </div>

      {params.flowSlug && !flow && <Notice backHref={rootHref}>This flow does not exist.</Notice>}
      {!params.flowSlug && params.moduleSlug && !currentModule && (
        <Notice backHref={rootHref}>This module does not exist.</Notice>
      )}

      {!params.flowSlug && !params.moduleSlug && map.modules.length === 0 && (
        <Notice backHref={`/dev-board/${project.id}`}>
          No map yet. Ask your agent to map this project with the forge-flows skill.
        </Notice>
      )}
      {!params.flowSlug && !params.moduleSlug && map.modules.length > 0 && (
        <ModuleMap
          projectId={project.id}
          map={map}
        />
      )}

      {!flow && currentModule && (
        <div className="flex flex-col gap-3">
          {currentModule.description && <p className="text-sm">{currentModule.description}</p>}
          <DependencyChips
            dependsOn={currentModule.dependsOn}
            known={known}
          />
          <ul className="flex flex-col gap-2">
            {map.flows
              .filter((item) => item.moduleSlug === currentModule.slug)
              .map((item) => (
                <li key={item.slug}>
                  <Link
                    href={mapHref(project.id, {
                      moduleSlug: currentModule.slug,
                      flowSlug: item.slug,
                    })}
                    className="flex flex-col gap-0.5 border border-border p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.stepCount} step{item.stepCount === 1 ? "" : "s"}
                      {item.summary ? ` · ${item.summary}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
          {map.flows.every((item) => item.moduleSlug !== currentModule.slug) && (
            <p className="text-sm text-muted-foreground">No flows in this currentModule yet.</p>
          )}
        </div>
      )}

      {flow && (
        <div className="flex flex-col gap-3">
          {flow.summary && <p className="text-sm">{flow.summary}</p>}
          {flow.commit && (
            <p className="font-mono text-xs text-muted-foreground">commit {flow.commit}</p>
          )}
          <FlowSteps steps={flow.steps} />
        </div>
      )}
    </div>
  );
}
