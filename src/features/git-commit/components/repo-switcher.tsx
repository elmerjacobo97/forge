import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronsUpDown, FolderPlus, GitBranch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { GitFile, SavedRepo } from "../types";

interface RepoSwitcherProps {
  repos: SavedRepo[];
  activeRepoPath: string;
  onSwitch: (repo: SavedRepo) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function RepoSwitcher({
  repos,
  activeRepoPath,
  onSwitch,
  onAdd,
  onRemove,
}: RepoSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [dirtyCounts, setDirtyCounts] = useState<Record<string, number>>({});

  const folderName = activeRepoPath
    ? activeRepoPath.split("/").filter(Boolean).pop()
    : null;

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next || repos.length === 0) return;
    const entries = await Promise.all(
      repos.map(async (repo) => {
        try {
          const files = await invoke<GitFile[]>("git_status", { repoPath: repo.path });
          return [repo.id, files.length] as const;
        } catch {
          return [repo.id, 0] as const;
        }
      }),
    );
    setDirtyCounts(Object.fromEntries(entries));
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
        <PopoverTrigger asChild>
          <button className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs">
            {activeRepoPath ? (
              <span className="min-w-0 flex-1 truncate" title={activeRepoPath}>
                <span className="text-muted-foreground">
                  {activeRepoPath.slice(0, activeRepoPath.lastIndexOf("/") + 1)}
                </span>
                <span className="font-medium text-foreground">{folderName}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">No repository selected</span>
            )}
            <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 gap-1.5 text-xs"
          onClick={onAdd}
        >
          <FolderPlus className="size-3.5" />
          Add
        </Button>
      </div>

      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandList>
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No repositories yet. Add one or drop a folder here.
            </CommandEmpty>
            <CommandGroup heading="Repositories">
              {repos.map((repo) => (
                <CommandItem
                  key={repo.id}
                  value={repo.path}
                  onSelect={() => {
                    onSwitch(repo);
                    setOpen(false);
                  }}
                  className="group/repo-item justify-between"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        dirtyCounts[repo.id] > 0 ? "bg-amber-500" : "bg-transparent",
                      )}
                      title={
                        dirtyCounts[repo.id] > 0
                          ? `${dirtyCounts[repo.id]} pending change${dirtyCounts[repo.id] === 1 ? "" : "s"}`
                          : undefined
                      }
                    />
                    <span className="min-w-0 flex-1 truncate" title={repo.path}>
                      <span
                        className={cn(
                          "font-medium",
                          repo.path === activeRepoPath && "text-primary",
                        )}
                      >
                        {repo.name}
                      </span>
                    </span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(repo.id);
                    }}
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover/repo-item:opacity-100"
                    title="Remove from list"
                  >
                    <X className="size-3" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAdd();
                }}
              >
                <FolderPlus className="size-3.5" />
                Add Repository…
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
