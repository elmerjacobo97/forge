import type { IdeaCategory, IdeaStatus } from "../types";

export const STATUSES: { value: IdeaStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "seed", label: "Seed" },
  { value: "exploring", label: "Exploring" },
  { value: "building", label: "Building" },
  { value: "parked", label: "Parked" },
  { value: "shipped", label: "Shipped" },
] as const;

export const CATEGORIES: { value: IdeaCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "app", label: "App" },
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
] as const;

export const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = STATUSES.filter(
  (status): status is { value: IdeaStatus; label: string } => status.value !== "all",
);

export const CATEGORY_OPTIONS: { value: IdeaCategory; label: string }[] = CATEGORIES.filter(
  (category): category is { value: IdeaCategory; label: string } => category.value !== "all",
);
