"use client";

import { Check, Clock, Copy, Loader2, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { statusColor } from "./http-tester-shared";
import type { HttpResponseData } from "./utils/history";
import { formatSize } from "./utils/request";

export interface ResponsePanelProps {
  response: HttpResponseData | null;
  error: string | null;
  loading: boolean;
  copied: boolean;
  onCopy: (text: string) => void;
}

export function ResponsePanel({
  response,
  error,
  loading,
  copied,
  onCopy,
}: ResponsePanelProps) {
  return (
    <div className="flex h-full flex-col gap-2">
      {loading && !response && (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Sending request…
        </div>
      )}

      {error && !loading && (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
          <Badge variant="destructive">Request Failed</Badge>
          <p className="max-w-md text-center font-mono text-xs text-destructive">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && !response && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-input/40">
            <Play className="size-6 opacity-40" />
          </div>
          <p className="text-xs">Send a request to see the response</p>
        </div>
      )}

      {response && !loading && (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-input/40 pb-2">
            <span
              className={cn(
                "font-mono text-sm font-bold",
                statusColor(response.status),
              )}
            >
              {response.status} {response.statusText}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Clock className="size-2.5" />
                {response.durationMs}ms
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {formatSize(response.size)}
              </Badge>
              {response.contentType && (
                <Badge variant="outline" className="text-[10px]">
                  {response.contentType.split(";")[0]}
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onCopy(response.body)}
                  className="ml-auto"
                >
                  {copied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy response body</TooltipContent>
            </Tooltip>
          </div>

          <Tabs defaultValue="body" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="body" className="text-xs">
                Body
              </TabsTrigger>
              <TabsTrigger value="headers" className="text-xs">
                Headers ({Object.keys(response.headers).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="body"
              className="mt-1 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full rounded-xl border border-input/60">
                <pre className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                  {response.body || "(empty body)"}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="headers"
              className="mt-1 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full rounded-xl border border-input/60">
                <div className="flex flex-col">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start gap-2 border-b border-input/40 px-3 py-1.5 last:border-0"
                    >
                      <span className="shrink-0 font-mono text-[11px] font-medium text-foreground">
                        {key}:
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground break-all">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
