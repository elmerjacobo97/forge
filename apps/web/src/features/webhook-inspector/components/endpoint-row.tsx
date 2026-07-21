"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Check, Copy, Trash2, Webhook } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopy } from "@/lib/hooks/use-copy";
import { cn } from "@/lib/utils";
import type { WebhookEndpoint } from "../types";
import { isEndpointExpired } from "../utils/limits";
import { buildWebhookPublicUrl } from "../utils/public-url";

type EndpointRowProps = {
  endpoint: WebhookEndpoint;
  selected?: boolean;
  onSelect?: (endpoint: WebhookEndpoint) => void;
  onDelete: (endpoint: WebhookEndpoint) => void;
};

function publicUrl(token: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  return buildWebhookPublicUrl(token, origin);
}

export function EndpointRow({
  endpoint,
  selected = false,
  onSelect,
  onDelete,
}: EndpointRowProps) {
  const { copied, copy } = useCopy();
  const expired = isEndpointExpired(endpoint.expiresAt);
  const url = publicUrl(endpoint.token);
  const label = endpoint.name.trim() || "Untitled endpoint";

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(endpoint)}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(endpoint);
        }
      }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors sm:flex-row sm:items-center",
        onSelect && "cursor-pointer hover:bg-accent/30",
        selected && "border-primary/40 bg-accent/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 rounded-md border border-border bg-muted/40 p-2 text-muted-foreground">
          <Webhook className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{label}</p>
            {expired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground" title={url}>
            {url}
          </p>
          <p className="text-xs text-muted-foreground">
            Expires {format(new Date(endpoint.expiresAt), "MMM d, yyyy HH:mm")} (
            {formatDistanceToNow(new Date(endpoint.expiresAt), {
              addSuffix: true,
            })}
            )
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                copy(url);
              }}
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy public webhook URL</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Delete ${label}`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(endpoint);
              }}
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete endpoint</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
