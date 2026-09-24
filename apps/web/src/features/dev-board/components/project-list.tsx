"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  KanbanIcon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createProjectAction, updateProjectAction } from "../actions";
import type { ProjectFormValues } from "../schemas/project";
import type { ProjectFilters } from "../schemas/project-filters";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "../types/project";
import type { Project, ProjectStatus } from "../types/project";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectForm } from "./project-form";
import { ProjectListToolbar } from "./project-list-toolbar";

const STATUS_TRIGGER_STYLES: Record<ProjectStatus, string> = {
  planned: "border-border bg-muted/60 text-muted-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  paused: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "border-border bg-transparent text-muted-foreground",
};

export function ProjectList({
  projects,
  filters,
  hasAnyProjects,
}: {
  projects: Project[];
  filters: ProjectFilters;
  hasAnyProjects: boolean;
}) {
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

  function handleStatusChange(project: Project, status: ProjectStatus) {
    if (status === project.status) return;

    startMutating(async () => {
      const result = await updateProjectAction(project.id, {
        name: project.name,
        description: project.description,
        status,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Project status updated.");
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
        {hasAnyProjects ? (
          <Button
            size="sm"
            onClick={openCreate}
            className="gap-1.5"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            New project
          </Button>
        ) : null}
      </div>

      <ProjectListToolbar filters={filters} />

      {projects.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={KanbanIcon}
                strokeWidth={2}
              />
            </EmptyMedia>
            <EmptyTitle>
              {hasAnyProjects ? "No projects match your filters" : "No projects yet"}
            </EmptyTitle>
            <EmptyDescription>
              {hasAnyProjects
                ? filters.status === "all" && !filters.q
                  ? "Archived projects are hidden by default. Choose Archived in the status filter to find them."
                  : "Try another search or status filter."
                : "Create a project to start tracking tickets on a dedicated board."}
            </EmptyDescription>
          </EmptyHeader>
          {!hasAnyProjects ? (
            <EmptyContent>
              <Button
                size="sm"
                onClick={openCreate}
                className="gap-1.5"
              >
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                Create project
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <Table className="table-fixed">
          <TableHeader className="sr-only sm:not-sr-only">
            <TableRow>
              <TableHead className="w-[55%]">Project</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="hidden w-36 sm:table-cell">Created</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="group/row"
              >
                <TableCell className="max-w-0 whitespace-normal py-2.5 sm:py-3">
                  <Link
                    href={`/dev-board/${project.id}`}
                    className="block min-w-0"
                  >
                    <span className="block truncate font-heading text-sm font-medium group-hover/row:underline">
                      {project.name}
                    </span>
                    <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">
                      {project.description || "No description"}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground sm:hidden">
                      Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal px-1.5 sm:px-2">
                  <Select
                    value={project.status}
                    onValueChange={(value) => handleStatusChange(project, value as ProjectStatus)}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={`Change status for ${project.name}`}
                      className={cn(
                        "h-6 w-fit max-w-full gap-1 border px-2 py-0 text-[10px] sm:text-xs",
                        STATUS_TRIGGER_STYLES[project.status],
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          {PROJECT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">
                  {format(new Date(project.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="px-1 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        aria-label={`Actions for ${project.name}`}
                      >
                        <HugeiconsIcon
                          icon={MoreHorizontalIcon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(project)}>
                        <HugeiconsIcon
                          icon={PencilEdit01Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(project)}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
