import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopy } from "@/lib/hooks/use-copy";
import type { Snippet } from "../types";

interface SnippetCardProps {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit, onDelete }: SnippetCardProps) {
  const { copied, copy } = useCopy();

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {snippet.kind}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(snippet.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="font-heading text-base font-medium leading-snug">
            {snippet.title}
          </h3>
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
        <div className="flex flex-wrap gap-1.5">
          {snippet.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs font-mono">
              #{t}
            </Badge>
          ))}
        </div>
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
