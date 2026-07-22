"use client";

import { Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { KeyValueEditor } from "./key-value-editor";
import { METHOD_COLORS, statusColor } from "./http-tester-shared";
import type {
  BodyType,
  HistoryEntry,
  HttpRequestConfig,
  KeyValue,
} from "./utils/history";

export interface RequestConfigPanelProps {
  config: HttpRequestConfig;
  history: HistoryEntry[];
  activeParamsCount: number;
  activeHeadersCount: number;
  hasBody: boolean;
  onParamsChange: (params: KeyValue[]) => void;
  onHeadersChange: (headers: KeyValue[]) => void;
  onBodyTypeChange: (bodyType: BodyType) => void;
  onBodyChange: (body: string) => void;
  onLoadFromHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  onDeleteHistory: (id: string) => void;
}

export function RequestConfigPanel({
  config,
  history,
  activeParamsCount,
  activeHeadersCount,
  hasBody,
  onParamsChange,
  onHeadersChange,
  onBodyTypeChange,
  onBodyChange,
  onLoadFromHistory,
  onClearHistory,
  onDeleteHistory,
}: RequestConfigPanelProps) {
  return (
    <Tabs defaultValue="params" className="flex h-full flex-col">
      <TabsList className="self-start">
        <TabsTrigger value="params" className="text-xs">
          Params
          {activeParamsCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
              {activeParamsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="headers" className="text-xs">
          Headers
          {activeHeadersCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
              {activeHeadersCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="body" className="text-xs">
          Body
          {hasBody && (
            <span className="ml-1 size-1.5 rounded-full bg-primary" />
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs">
          History
          {history.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
              {history.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="params"
        className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <ScrollArea className="h-full">
          <div className="p-1 pb-4">
            <KeyValueEditor
              pairs={config.params}
              onChange={onParamsChange}
              keyPlaceholder="param name"
              valuePlaceholder="value"
            />
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent
        value="headers"
        className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <ScrollArea className="h-full">
          <div className="p-1 pb-4">
            <KeyValueEditor
              pairs={config.headers}
              onChange={onHeadersChange}
              keyPlaceholder="Header-Name"
              valuePlaceholder="header value"
            />
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent
        value="body"
        className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <div className="flex h-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <Select
              value={config.bodyType}
              onValueChange={(v) => onBodyTypeChange(v as BodyType)}
            >
              <SelectTrigger className="h-7 w-32 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="form">Form Data</SelectItem>
              </SelectContent>
            </Select>
            {config.bodyType === "json" && (
              <Badge variant="outline" className="text-[10px]">
                Content-Type: application/json
              </Badge>
            )}
          </div>
          {config.bodyType !== "none" ? (
            <Textarea
              value={config.body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={
                config.bodyType === "json"
                  ? '{\n  "key": "value"\n}'
                  : config.bodyType === "form"
                    ? '[{"key":"name","value":"John","enabled":true}]'
                    : "Request body…"
              }
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-input/40 text-xs text-muted-foreground">
              This request has no body.
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent
        value="history"
        className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <div className="flex h-full flex-col gap-2">
          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearHistory}
              className="h-7 w-fit text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3" />
              Clear all
            </Button>
          )}
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-1 pb-4">
              {history.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                  No requests yet.
                </div>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-2 rounded-lg border border-input/40 px-2 py-1.5 transition-colors hover:bg-muted/40"
                  >
                    <button
                      type="button"
                      onClick={() => onLoadFromHistory(entry)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[10px] font-bold",
                          statusColor(entry.response.status),
                        )}
                      >
                        {entry.response.status}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[10px] font-semibold",
                          METHOD_COLORS[entry.request.method],
                        )}
                      >
                        {entry.request.method}
                      </span>
                      <span className="truncate font-mono text-[11px]">
                        {entry.request.url}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        {entry.response.durationMs}ms
                      </span>
                    </button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onDeleteHistory(entry.id)}
                      className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  );
}
