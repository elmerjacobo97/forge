import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { GitFile } from "../types";

export function useGitStatus() {
  const [files, setFiles] = useState<GitFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (repoPath: string) => {
    if (!repoPath) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<GitFile[]>("git_status", { repoPath });
      setFiles(result);
    } catch (e) {
      setError(String(e));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const stage = useCallback(
    async (repoPath: string, paths: string[]) => {
      await invoke("git_add", { repoPath, files: paths });
      await refresh(repoPath);
    },
    [refresh],
  );

  const unstage = useCallback(
    async (repoPath: string, paths: string[]) => {
      await invoke("git_unstage", { repoPath, files: paths });
      await refresh(repoPath);
    },
    [refresh],
  );

  return { files, loading, error, refresh, stage, unstage };
}
