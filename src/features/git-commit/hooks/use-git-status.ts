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

  return { files, loading, error, refresh };
}
