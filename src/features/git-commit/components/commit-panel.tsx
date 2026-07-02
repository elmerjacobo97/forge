import { useState } from "react";
import { Sparkles, GitCommitHorizontal, Loader2, Link } from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateCommitMessage, DiffEntry } from "../services/groq-service";

interface CommitPanelProps {
  repoPath: string;
  selectedFiles: string[];
  onCommitSuccess: () => void;
}

export function CommitPanel({
  repoPath,
  selectedFiles,
  onCommitSuccess,
}: CommitPanelProps) {
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);

  async function handleGenerate() {
    if (selectedFiles.length === 0) {
      toast.error("Select at least one file first.");
      return;
    }
    setGenerating(true);
    try {
      // Fetch the diff ONLY for the selected files, excluding verbose lockfiles.
      // Keep each file's diff separate (not flattened into one string) so the
      // model always sees every changed file, not just whichever fit first.
      const entries: DiffEntry[] = await Promise.all(
        selectedFiles
          .filter((file) => {
            const lower = file.toLowerCase();
            return (
              !lower.endsWith("pnpm-lock.yaml") &&
              !lower.endsWith("cargo.lock") &&
              !lower.endsWith("package-lock.json") &&
              !lower.endsWith("yarn.lock")
            );
          })
          .map(async (file) => {
            const [unstaged, staged] = await Promise.all([
              invoke<string>("git_diff", {
                repoPath,
                filePath: file,
                staged: false,
              }).catch(() => ""),
              invoke<string>("git_diff", {
                repoPath,
                filePath: file,
                staged: true,
              }).catch(() => ""),
            ]);
            return { path: file, diff: [staged, unstaged].filter(Boolean).join("\n") };
          })
      );

      if (!entries.some((e) => e.diff.trim())) {
        toast.error(
          "No diff found. Make sure the selected files have uncommitted changes.",
        );
        return;
      }

      const generated = await generateCommitMessage(entries);
      setMessage(generated);
      toast.success("Commit message generated!");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function handleCommit() {
    if (!message.trim()) {
      toast.error("Write a commit message first.");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Select at least one file to commit.");
      return;
    }
    setCommitting(true);
    try {
      const hash = await invoke<string>("git_commit", {
        repoPath,
        files: selectedFiles,
        message: message.trim(),
      });
      toast.success(`Committed! ${hash}`);
      setMessage("");
      onCommitSuccess();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setCommitting(false);
    }
  }

  const canCommit = message.trim().length > 0 && selectedFiles.length > 0 && !committing;
  const charCount = message.length;
  const isOverLimit = charCount > 72;

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <GitCommitHorizontal className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Commit</span>
        {selectedFiles.length > 0 && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link className="size-3" />
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="feat(scope): describe your changes…"
            className="h-full min-h-[120px] resize-none font-mono text-xs"
            disabled={committing}
          />
          <span
            className={`absolute bottom-2 right-2 text-[10px] tabular-nums ${
              isOverLimit ? "text-destructive" : "text-muted-foreground/60"
            }`}
          >
            {charCount}/72
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={generating || committing || selectedFiles.length === 0}
        >
          {generating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 text-violet-500" />
          )}
          {generating ? "Generating…" : "Generate with Groq"}
        </Button>
      </div>

      <Button
        size="sm"
        className="w-full gap-2"
        onClick={handleCommit}
        disabled={!canCommit}
      >
        {committing ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <GitCommitHorizontal className="size-3.5" />
        )}
        {committing ? "Committing…" : "Commit"}
      </Button>
    </div>
  );
}
