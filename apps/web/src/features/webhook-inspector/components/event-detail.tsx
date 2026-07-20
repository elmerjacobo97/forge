"use client";

import { format } from "date-fns";
import { Check, Copy, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopy } from "@/lib/hooks/use-copy";
import type { WebhookEvent } from "../types";
import { eventToCurl } from "../utils/curl";

type EventDetailProps = {
  event: WebhookEvent | null;
};

function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function EventDetail({ event }: EventDetailProps) {
  const curlCopy = useCopy();
  const payloadCopy = useCopy();

  if (!event) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
        Select an event to inspect headers and body.
      </div>
    );
  }

  const headerEntries = Object.entries(event.headers).toSorted(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono">
          {event.method}
        </Badge>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {event.path}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {format(new Date(event.receivedAt), "MMM d, yyyy HH:mm:ss")}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {event.sourceIp ? <span>IP {event.sourceIp}</span> : null}
        {event.userAgent ? (
          <span className="truncate" title={event.userAgent}>
            UA {event.userAgent}
          </span>
        ) : null}
        {event.bodyTruncated ? (
          <Badge variant="secondary">Body truncated</Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => curlCopy.copy(eventToCurl(event, appOrigin()))}
            >
              {curlCopy.copied ? (
                <Check className="size-3.5" />
              ) : (
                <Terminal className="size-3.5" />
              )}
              {curlCopy.copied ? "Copied" : "Copy as cURL"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy a curl command for this request</TooltipContent>
        </Tooltip>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Headers
          </h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              payloadCopy.copy(JSON.stringify(event.headers, null, 2))
            }
          >
            {payloadCopy.copied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            Copy
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-2 font-mono text-[11px]">
          {headerEntries.length === 0 ? (
            <p className="text-muted-foreground">No headers</p>
          ) : (
            <dl className="space-y-1">
              {headerEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-0.5 sm:grid-cols-[minmax(0,10rem)_1fr]"
                >
                  <dt className="truncate text-muted-foreground">{key}</dt>
                  <dd className="break-all">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="min-h-0 flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Body
          </h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!event.body}
            onClick={() => payloadCopy.copy(event.body)}
          >
            <Copy className="size-3" />
            Copy
          </Button>
        </div>
        <pre className="min-h-32 whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/20 p-3 font-mono text-[11px]">
          {event.body || (
            <span className="text-muted-foreground">(empty)</span>
          )}
        </pre>
      </section>
    </div>
  );
}
