import { Badge } from "@/components/ui/badge";
import { Snippet } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Check } from "lucide-react";
import { useDeleteSnippetMutation } from "../hooks/mutations";
import { useCopy } from "@/lib/hooks/use-copy";

interface SnippetCardProps {
  snippet: Snippet;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  const deleteMutation = useDeleteSnippetMutation();
  const { copied, copy } = useCopy();

  function deleteSnippet(id: string) {
    deleteMutation.mutate(id);
  }

  return (
    <div
      key={snippet.id}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
    >
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
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => deleteSnippet(snippet.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="size-3.5" />
        </Button>
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
