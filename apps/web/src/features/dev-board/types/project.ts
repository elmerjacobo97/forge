export const PROJECT_STATUSES = [
  "planned",
  "in_progress",
  "paused",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface ProjectCreateInput {
  name: string;
  description: string;
  status: ProjectStatus;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>;
