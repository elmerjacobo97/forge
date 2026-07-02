import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useGitDiff() {
  const [diff, setDiff] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiff = useCallback(async (repoPath: string, filePath?: string, staged = false) => {
    if (!repoPath) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<string>("git_diff", {
        repoPath,
        filePath: filePath ?? null,
        staged,
      });
      setDiff(result);
    } catch (e) {
      setError(String(e));
      setDiff("");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setDiff("");
    setError(null);
  }, []);

  return { diff, loading, error, fetchDiff, clear };
}
