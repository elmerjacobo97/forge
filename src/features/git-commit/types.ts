export interface GitFile {
  path: string;
  /** Two-char porcelain status e.g. " M", "A ", "??" */
  status: string;
  staged: boolean;
  unstaged: boolean;
}

export type FileStatusLabel =
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "untracked"
  | "unknown";

export function getStatusLabel(status: string): FileStatusLabel {
  const index = status[0];
  const worktree = status[1];
  if (index === "?" && worktree === "?") return "untracked";
  if (index === "A") return "added";
  if (index === "D" || worktree === "D") return "deleted";
  if (index === "R") return "renamed";
  if (index === "M" || worktree === "M") return "modified";
  return "unknown";
}

export const STATUS_BADGE: Record<FileStatusLabel, { label: string; color: string }> = {
  modified:  { label: "M", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  added:     { label: "A", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  deleted:   { label: "D", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  renamed:   { label: "R", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  untracked: { label: "U", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  unknown:   { label: "?", color: "bg-muted text-muted-foreground" },
};

export const REPO_STORE_KEY = "git_last_repo_path";
