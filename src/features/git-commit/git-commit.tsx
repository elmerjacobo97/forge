import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import { AlertTriangle, GitCommitHorizontal } from "lucide-react";
import { toast } from "sonner";

import { RepoPicker } from "./components/repo-picker";
import { FileList } from "./components/file-list";
import { DiffViewer } from "./components/diff-viewer";
import { CommitPanel } from "./components/commit-panel";
import { useGitStatus } from "./hooks/use-git-status";
import { useGitDiff } from "./hooks/use-git-diff";
import { REPO_STORE_KEY } from "./types";

const STORE_FILE = "forge-settings.json";

async function getStore() {
  return load(STORE_FILE);
}

export function GitCommit() {
  const [repoPath, setRepoPath] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showStaged, setShowStaged] = useState(false);
  const storeReady = useRef(false);

  const { files, loading: statusLoading, error: statusError, refresh } = useGitStatus();
  const { diff, loading: diffLoading, fetchDiff, clear: clearDiff } = useGitDiff();

  // Load persisted repo path on mount
  useEffect(() => {
    getStore()
      .then((store) => store.get<string>(REPO_STORE_KEY))
      .then((saved) => {
        if (saved) {
          setRepoPath(saved);
          storeReady.current = true;
        }
      })
      .catch(() => {});
  }, []);

  // Auto-refresh when repo path changes
  useEffect(() => {
    if (repoPath) refresh(repoPath);
    else setActiveFile(null);
  }, [repoPath, refresh]);

  // Refresh diff when active file or staged mode changes
  useEffect(() => {
    if (activeFile && repoPath) {
      fetchDiff(repoPath, activeFile, showStaged);
    } else {
      clearDiff();
    }
  }, [activeFile, showStaged, repoPath, fetchDiff, clearDiff]);

  const handlePickRepo = useCallback(async () => {
    try {
      const dir = await open({ directory: true, multiple: false });
      if (typeof dir === "string" && dir) {
        setRepoPath(dir);
        setSelected(new Set());
        setActiveFile(null);
        clearDiff();
        const store = await getStore();
        await store.set(REPO_STORE_KEY, dir);
        await store.save();
      }
    } catch {
      toast.error("Failed to open directory picker.");
    }
  }, [clearDiff]);

  const handleToggle = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    const allSelected = files.every((f) => selected.has(f.path));
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(files.map((f) => f.path)));
  }, [files, selected]);

  const handleSelectFile = useCallback(
    (path: string) => {
      setActiveFile(path);
      setShowStaged(selected.has(path));
    },
    [selected],
  );

  const handleCommitSuccess = useCallback(() => {
    setSelected(new Set());
    setActiveFile(null);
    clearDiff();
    if (repoPath) refresh(repoPath);
  }, [repoPath, refresh, clearDiff]);


  return (
    <div className="flex h-full flex-col gap-3">
      {/* Repo Picker */}
      <RepoPicker repoPath={repoPath} onPick={handlePickRepo} />

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
            <p className="text-xs">Open a local git repository to get started.</p>
          </div>
        </div>
      ) : (
        /* 3-panel layout */
        <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_220px] gap-3 overflow-hidden">
          {/* Panel 1 — File list */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <FileList
              files={files}
              loading={statusLoading}
              selected={selected}
              activeFile={activeFile}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              onSelect={handleSelectFile}
              onRefresh={() => refresh(repoPath)}
            />
          </div>

          {/* Panel 2 — Diff viewer */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <DiffViewer
              diff={diff}
              loading={diffLoading}
              filePath={activeFile}
            />
          </div>

          {/* Panel 3 — Commit panel */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <CommitPanel
              repoPath={repoPath}
              selectedFiles={[...selected]}
              onCommitSuccess={handleCommitSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
