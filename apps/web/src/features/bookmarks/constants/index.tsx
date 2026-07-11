import { Category } from "../types";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all" as Category, label: "All" },
  { value: "docs", label: "Docs" },
  { value: "git", label: "Git" },
  { value: "tool", label: "Tools" },
  { value: "article", label: "Articles" },
  { value: "other", label: "Other" },
] as const;
