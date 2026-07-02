import { FolderOpen, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepoPickerProps {
  repoPath: string;
  onPick: () => void;
}

export function RepoPicker({ repoPath, onPick }: RepoPickerProps) {
  const folderName = repoPath ? repoPath.split("/").filter(Boolean).pop() : null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-xs">
        {repoPath ? (
          <span title={repoPath}>
            <span className="text-muted-foreground">{repoPath.slice(0, repoPath.lastIndexOf("/") + 1)}</span>
            <span className="font-medium text-foreground">{folderName}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">No repository selected</span>
        )}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 shrink-0 gap-1.5 text-xs"
        onClick={onPick}
      >
        <FolderOpen className="size-3.5" />
        {repoPath ? "Change" : "Open Repo"}
      </Button>
    </div>
  );
}
