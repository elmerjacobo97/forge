import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { AlertTriangle, GitCommitHorizontal } from "lucide-react";
import { toast } from "sonner";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { RepoSwitcher } from "@/features/git-commit/components/repo-switcher";
import { FileList } from "@/features/git-commit/components/file-list";
import { DiffViewer } from "@/features/git-commit/components/diff-viewer";
import { CommitPanel } from "@/features/git-commit/components/commit-panel";
import { useGitStatus } from "@/features/git-commit/hooks/use-git-status";
import { useGitDiff } from "@/features/git-commit/hooks/use-git-diff";
import { useSavedReposQuery } from "@/features/git-commit/hooks/queries";
import {
  useAddRepoMutation,
  useRemoveRepoMutation,
  useTouchRepoMutation,
} from "@/features/git-commit/hooks/mutations";
import type { SavedRepo } from "@/features/git-commit/types";

interface DragDropPayload {
  paths: string[];
}

export const Route = createFileRoute("/_authenticated/git-commit")({
  component: RouteComponent,
});

function RouteComponent() {
  const [repoPath, setRepoPath] = useState<string>("");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showStaged, setShowStaged] = useState(false);

  const {
    files,
    loading: statusLoading,
    error: statusError,
    refresh,
    stage,
    unstage,
  } = useGitStatus();
  const { diff, loading: diffLoading, fetchDiff, clear: clearDiff } = useGitDiff();

  const { data: repos = [] } = useSavedReposQuery();
  const addRepoMutation = useAddRepoMutation();
  const removeRepoMutation = useRemoveRepoMutation();
  const touchRepoMutation = useTouchRepoMutation();

  const stagedFiles = useMemo(() => files.filter((f) => f.staged).map((f) => f.path), [files]);

  // Default to the most recently opened repo once the saved list loads.
  useEffect(() => {
    if (!repoPath && repos.length > 0) {
      setRepoPath(repos[0].path);
    }
  }, [repos, repoPath]);

  // Auto-refresh when repo path changes
  useEffect(() => {
    if (repoPath) refresh(repoPath);
    else setActiveFile(null);
  }, [repoPath, refresh]);

  // Refresh diff when the active file or its staged state changes
  useEffect(() => {
    if (activeFile && repoPath) {
      fetchDiff(repoPath, activeFile, showStaged);
    } else {
      clearDiff();
    }
  }, [activeFile, showStaged, repoPath, fetchDiff, clearDiff]);

  const handleSwitchRepo = useCallback(
    (repo: SavedRepo) => {
      setRepoPath(repo.path);
      setActiveFile(null);
      setShowStaged(false);
      clearDiff();
      touchRepoMutation.mutate(repo.id);
    },
    [clearDiff, touchRepoMutation],
  );

  const handlePickRepo = useCallback(async () => {
    try {
      const dir = await open({ directory: true, multiple: false });
      if (typeof dir === "string" && dir) {
        const repo = await addRepoMutation.mutateAsync(dir);
        handleSwitchRepo(repo);
      }
    } catch {
      toast.error("Failed to open directory picker.");
    }
  }, [addRepoMutation, handleSwitchRepo]);

  const handleRemoveRepo = useCallback(
    (id: string) => {
      const wasActive = repos.find((r) => r.id === id)?.path === repoPath;
      removeRepoMutation.mutate(id, {
        onSuccess: (remaining) => {
          if (!wasActive) return;
          if (remaining[0]) {
            handleSwitchRepo(remaining[0]);
          } else {
            setRepoPath("");
            setActiveFile(null);
            setShowStaged(false);
            clearDiff();
          }
        },
      });
    },
    [repos, repoPath, removeRepoMutation, handleSwitchRepo, clearDiff],
  );

  // Native drag-drop (Tauri runtime) — drop a folder anywhere to add & switch to it.
  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | null = null;

    async function setup() {
      try {
        unlisten = await listen<DragDropPayload>("tauri://drag-drop", async (event) => {
          if (!mounted) return;
          const path = event.payload.paths[0];
          if (!path) return;
          try {
            const repo = await addRepoMutation.mutateAsync(path);
            handleSwitchRepo(repo);
          } catch {
            toast.error("Failed to add dropped folder as a repository.");
          }
        });
      } catch {
        // Web-only dev mode: native drag-drop unavailable.
      }
    }

    setup();

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent browser from navigating on drop.
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("dragenter", preventDefault);
    document.addEventListener("dragover", preventDefault);
    document.addEventListener("drop", preventDefault);
    return () => {
      document.removeEventListener("dragenter", preventDefault);
      document.removeEventListener("dragover", preventDefault);
      document.removeEventListener("drop", preventDefault);
    };
  }, []);

  const handleSelectFile = useCallback(
    (path: string) => {
      setActiveFile(path);
      // Staged files show the staged (index vs HEAD) diff; everything else
      // shows the working-tree diff — driven by the file's real git status.
      const file = files.find((f) => f.path === path);
      setShowStaged(!!file && file.staged && !file.unstaged);
    },
    [files],
  );

  const handleStage = useCallback(
    (paths: string[]) => {
      if (repoPath) stage(repoPath, paths);
    },
    [repoPath, stage],
  );

  const handleUnstage = useCallback(
    (paths: string[]) => {
      if (repoPath) unstage(repoPath, paths);
    },
    [repoPath, unstage],
  );

  const handleCommitSuccess = useCallback(() => {
    setActiveFile(null);
    setShowStaged(false);
    clearDiff();
    if (repoPath) refresh(repoPath);
  }, [repoPath, refresh, clearDiff]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Repo Switcher */}
      <RepoSwitcher
        repos={repos}
        activeRepoPath={repoPath}
        onSwitch={handleSwitchRepo}
        onAdd={handlePickRepo}
        onRemove={handleRemoveRepo}
      />

      {/* Error banner */}
      {statusError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          {statusError}
        </div>
      )}

      {/* Empty state — no repo */}
      {!repoPath ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <GitCommitHorizontal className="size-12 opacity-20" />
          <div>
            <p className="text-sm font-medium">No repository selected</p>
            <p className="text-xs">
              Open a local git repository, or drop a folder here, to get started.
            </p>
          </div>
        </div>
      ) : (
        /* 3-panel resizable layout */
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          {/* Panel 1 — File list */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            className="p-2"
          >
            <div className="h-full overflow-hidden rounded-xl border border-input/60 bg-muted/20">
              <FileList
                files={files}
                loading={statusLoading}
                activeFile={activeFile}
                onSelect={handleSelectFile}
                onStage={handleStage}
                onUnstage={handleUnstage}
                onRefresh={() => refresh(repoPath)}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-transparent"
          />

          {/* Panel 2 — Diff viewer */}
          <ResizablePanel
            defaultSize={60}
            minSize={30}
            className="p-2"
          >
            <div className="h-full overflow-hidden rounded-xl border border-input/60 bg-muted/20">
              <DiffViewer
                diff={diff}
                loading={diffLoading}
                filePath={activeFile}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-transparent"
          />

          {/* Panel 3 — Commit panel */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            className="p-2"
          >
            <div className="h-full overflow-hidden rounded-xl border border-input/60 bg-muted/20">
              <CommitPanel
                repoPath={repoPath}
                stagedFiles={stagedFiles}
                onCommitSuccess={handleCommitSuccess}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
