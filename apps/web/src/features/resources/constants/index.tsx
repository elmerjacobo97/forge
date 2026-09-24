import type { ResourceCategory } from "../types";

export const CATEGORIES: { value: ResourceCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "docs", label: "Docs" },
  { value: "git", label: "Git" },
  { value: "tool", label: "Tools" },
  { value: "article", label: "Articles" },
  { value: "other", label: "Other" },
] as const;
