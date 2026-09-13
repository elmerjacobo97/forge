export interface Idea {
  id: string;
  title: string;
  content: string;
  status: IdeaStatus;
  category: IdeaCategory;
  tags: string[];
  links: string[];
  createdAt: string;
}

export type IdeaStatus = "seed" | "exploring" | "building" | "parked" | "shipped";

export type IdeaCategory = "app" | "web" | "mobile" | "business" | "other";
