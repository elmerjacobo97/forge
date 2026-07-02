import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCommitHorizontal } from "lucide-react";

interface DiffViewerProps {
  diff: string;
  loading: boolean;
  filePath: string | null;
}

function parseDiffLines(diff: string) {
  return diff.split("\n").map((line, i) => {
    let type: "add" | "remove" | "header" | "hunk" | "normal" = "normal";
    if (line.startsWith("+++") || line.startsWith("---")) type = "header";
    else if (line.startsWith("@@")) type = "hunk";
    else if (line.startsWith("+")) type = "add";
    else if (line.startsWith("-")) type = "remove";
    return { key: i, content: line, type };
  });
}

export function DiffViewer({ diff, loading, filePath }: DiffViewerProps) {
  if (!filePath) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <GitCommitHorizontal className="size-8 opacity-30" />
        <p className="text-xs">Select a file to see its diff</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground animate-pulse">Loading diff…</p>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">No diff available</p>
      </div>
    );
  }

  const lines = parseDiffLines(diff);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground truncate block" title={filePath}>
          {filePath}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <pre className="min-w-0 p-2 text-[11px] leading-5 font-mono">
          {lines.map(({ key, content, type }) => (
            <div
              key={key}
              className={cn(
                "px-2",
                type === "add" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                type === "remove" && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                type === "hunk" && "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold",
                type === "header" && "text-muted-foreground",
                type === "normal" && "text-foreground/80",
              )}
            >
              {content || " "}
            </div>
          ))}
        </pre>
      </ScrollArea>
    </div>
  );
}
