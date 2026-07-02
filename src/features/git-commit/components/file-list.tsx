import { cn } from "@/lib/utils";
import type { GitFile } from "../types";
import { getStatusLabel, STATUS_BADGE } from "../types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileListProps {
  files: GitFile[];
  loading: boolean;
  activeFile: string | null;
  onSelect: (path: string) => void;
  onStage: (paths: string[]) => void;
  onUnstage: (paths: string[]) => void;
  onRefresh: () => void;
}

export function FileList({
  files,
  loading,
  activeFile,
  onSelect,
  onStage,
  onUnstage,
  onRefresh,
}: FileListProps) {
  const allStaged = files.length > 0 && files.every((f) => f.staged);
  const someStaged = files.some((f) => f.staged);

  function handleToggleAll() {
    if (allStaged) {
      onUnstage(files.map((f) => f.path));
    } else {
      onStage(files.filter((f) => !f.staged).map((f) => f.path));
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={allStaged || (someStaged ? "indeterminate" : false)}
            onCheckedChange={handleToggleAll}
            disabled={files.length === 0}
          />
          <label
            htmlFor="select-all"
            className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
          >
            {files.length} file{files.length === 1 ? "" : "s"}
          </label>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading…" : "No changes detected"}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-px p-1.5">
            {files.map((file) => {
              const label = getStatusLabel(file.status);
              const badge = STATUS_BADGE[label];
              const isActive = activeFile === file.path;

              return (
                <li
                  key={file.path}
                  onClick={() => onSelect(file.path)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-muted/50",
                  )}
                >
                  <Checkbox
                    checked={file.staged}
                    onCheckedChange={(checked) => {
                      if (checked === "indeterminate") return;
                      if (checked) onStage([file.path]);
                      else onUnstage([file.path]);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <span
                    className={cn(
                      "shrink-0 rounded px-1 py-0.5 font-mono text-[10px] font-semibold",
                      badge.color,
                    )}
                  >
                    {badge.label}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-xs"
                    title={file.path}
                  >
                    {file.path}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
