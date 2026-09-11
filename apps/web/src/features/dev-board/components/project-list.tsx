"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createProjectAction, updateProjectAction } from "../actions";
import type { ProjectFormValues } from "../schemas/project";
import type { Project } from "../types/project";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectForm } from "./project-form";

export function ProjectList({ projects }: { projects: Project[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [, startMutating] = useTransition();

  function openCreate() {
    setEditProject(null);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditProject(project);
    setDialogOpen(true);
  }

  function handleSubmit(values: ProjectFormValues) {
    const project = editProject;

    startMutating(async () => {
      const result = project
        ? await updateProjectAction(project.id, values)
        : await createProjectAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(project ? "Project updated." : "Project created.");
      setDialogOpen(false);
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-lg font-medium tracking-tight">Projects</h1>
          <p className="text-xs text-muted-foreground">
            Each project has its own kanban board and analytics.
          </p>
        </div>
        {projects.length > 0 ? (
          <Button
            size="sm"
            onClick={openCreate}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            New project
          </Button>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create a project to start tracking tickets on a dedicated board.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Create project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <article className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        aria-label={`Actions for ${project.name}`}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(project)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(project)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link
                  href={`/dev-board/${project.id}`}
                  className="flex min-h-24 flex-1 flex-col pr-8"
                >
                  <h2 className="font-heading text-base font-medium leading-snug group-hover:underline">
                    {project.name}
                  </h2>
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
                    {project.description || "No description"}
                  </p>
                  <p className="mt-auto pt-3 text-[11px] text-muted-foreground">
                    Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                  </p>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}

      <ProjectForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editProject={editProject}
        onSubmit={handleSubmit}
      />

      {deleteTarget ? (
        <DeleteProjectDialog
          project={deleteTarget}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
