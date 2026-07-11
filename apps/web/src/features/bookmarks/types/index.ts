export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: Category;
  description: string;
  tags: string[];
  createdAt: string;
}

export type Category = "docs" | "git" | "tool" | "article" | "other";
