"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useUserQuery } from "@/features/auth/hooks/queries";

import {
  useCreateDevBoardProject,
  useDeleteDevBoardProject,
  useUpdateDevBoardProject,
} from "../hooks/mutations";
import { useDevBoardProjects } from "../hooks/queries";
import type { ProjectFormValues } from "../schemas/project";
import type { Project } from "../types/project";
import { ProjectForm } from "./project-form";

export function ProjectList() {
  const { data: user } = useUserQuery();
  const projectsQuery = useDevBoardProjects(user?.id);
  const createMutation = useCreateDevBoardProject();
  const updateMutation = useUpdateDevBoardProject();
  const deleteMutation = useDeleteDevBoardProject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const projects = projectsQuery.data ?? [];

  function openCreate() {
    setEditProject(null);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditProject(project);
    setDialogOpen(true);
  }

  function handleSubmit(values: ProjectFormValues) {
    if (editProject) {
      updateMutation.mutate({ projectId: editProject.id, input: values });
      return;
    }
    createMutation.mutate(values);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }

  if (projectsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load projects</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{projectsQuery.error.message}</span>
          <Button size="sm" variant="outline" onClick={() => void projectsQuery.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
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
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-3.5" />
            New project
          </Button>
        ) : null}
      </div>

      {projectsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
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
            <Button size="sm" onClick={openCreate} className="gap-1.5">
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

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be removed. Projects with tickets cannot be deleted.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
