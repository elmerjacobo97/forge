export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ProjectCreateInput {
  name: string;
  description: string;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>;
