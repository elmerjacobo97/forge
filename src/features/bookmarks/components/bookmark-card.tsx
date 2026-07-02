import { Badge } from "@/components/ui/badge";
import { Bookmark } from "../types";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { useDeleteBookmarkMutation } from "../hooks/mutations";

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const deleteMutation = useDeleteBookmarkMutation();

  function deleteBookmark(id: string) {
    deleteMutation.mutate(id);
  }

  return (
    <div
      key={bookmark.id}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {bookmark.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(bookmark.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="font-heading text-base font-medium leading-snug">
            {bookmark.title}
          </h3>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => deleteBookmark(bookmark.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex-1 space-y-3">
        <p className="text-sm text-muted-foreground">{bookmark.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {bookmark.tags.map((t) => (
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
          onClick={() => window.open(bookmark.url, "_blank")}
        >
          Open
          <ExternalLink className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
