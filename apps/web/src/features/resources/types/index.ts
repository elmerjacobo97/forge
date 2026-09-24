export interface Resource {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  description: string;
  tags: string[];
  createdAt: string;
}

export type ResourceCategory = "docs" | "git" | "tool" | "article" | "other";
