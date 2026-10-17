import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapHref } from "../schemas/map-params";
import type { ProjectMap } from "../types";
import { DependencyChips } from "./dependency-chips";

export function ModuleMap({ projectId, map }: { projectId: string; map: ProjectMap }) {
  const known = new Set(map.modules.map((module) => module.slug));

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {map.modules.map((module) => {
        const flowCount = map.flows.filter((flow) => flow.moduleSlug === module.slug).length;
        return (
          <Link
            key={module.slug}
            href={mapHref(projectId, { moduleSlug: module.slug })}
            className="focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{module.name}</CardTitle>
                <CardDescription className="line-clamp-2">{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DependencyChips
                  dependsOn={module.dependsOn}
                  known={known}
                />
                <p className="text-xs text-muted-foreground">
                  {flowCount} flow{flowCount === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
