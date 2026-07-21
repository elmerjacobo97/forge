import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopy } from "@/lib/hooks/use-copy";
import { FORMATS, TOOLS } from "../constants";
import type { Snippet } from "../types";

interface SnippetCardProps {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
}

function getToolLabel(snippet: Snippet): string | null {
  if (!snippet.tool) return null;
  if (snippet.tool === "other") return snippet.customTool || "Other";
  return TOOLS.find((tool) => tool.value === snippet.tool)?.label ?? snippet.tool;
}

function getFormatLabel(language: string | null): string | null {
  if (!language) return null;
  return FORMATS.find((format) => format.value === language.toLowerCase())?.label ?? language;
}

export function SnippetCard({ snippet, onEdit, onDelete }: SnippetCardProps) {
  const { copied, copy } = useCopy();
  const toolLabel = getToolLabel(snippet);
  const formatLabel = getFormatLabel(snippet.language);

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="capitalize"
            >
              {snippet.kind}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(snippet.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <h3 className="font-heading text-base font-medium leading-snug">{snippet.title}</h3>
          {toolLabel || snippet.version || formatLabel ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {toolLabel ? <span>Tool: {toolLabel}</span> : null}
              {snippet.version ? <span>Version: {snippet.version}</span> : null}
              {formatLabel ? <span>Format: {formatLabel}</span> : null}
            </div>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              aria-label={`Actions for ${snippet.title}`}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(snippet)}>
              <Pencil className="size-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(snippet)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex-1 space-y-3">
        <pre className="max-h-32 overflow-hidden rounded-lg bg-muted/30 p-2 font-mono text-xs whitespace-pre-wrap break-all">
          {snippet.content}
        </pre>
        {snippet.tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {snippet.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-mono"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => copy(snippet.content)}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
