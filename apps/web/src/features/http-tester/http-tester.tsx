import { useState } from "react";
import {
  Check,
  Clock,
  Copy,
  Loader2,
  Play,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useCopy } from "@/lib/hooks/use-copy";
import { KeyValueEditor } from "./key-value-editor";
import {
  type BodyType,
  type HttpRequestConfig,
  type HttpMethod,
  type HistoryEntry,
  type HttpResponseData,
  type KeyValue,
  addHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from "./utils/history";
import { executeRequest, formatSize } from "./utils/request";

const METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-amber-600 dark:text-amber-400",
  PUT: "text-blue-600 dark:text-blue-400",
  PATCH: "text-violet-600 dark:text-violet-400",
  DELETE: "text-destructive",
  HEAD: "text-muted-foreground",
  OPTIONS: "text-muted-foreground",
};

const DEFAULT_CONFIG: HttpRequestConfig = {
  method: "GET",
  url: "",
  params: [],
  headers: [],
  bodyType: "none",
  body: "",
};

function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return "text-emerald-600 dark:text-emerald-400";
  if (status >= 300 && status < 400) return "text-blue-600 dark:text-blue-400";
  if (status >= 400 && status < 500)
    return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function HttpTester() {
  const [config, setConfig] = useState<HttpRequestConfig>(DEFAULT_CONFIG);
  const [response, setResponse] = useState<HttpResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const { copied, copy } = useCopy();

  async function sendRequest() {
    setLoading(true);
    setError(null);
    setResponse(null);

    const result = await executeRequest(config);

    if (result.error) {
      setError(result.error);
    } else if (result.response) {
      setResponse(result.response);
      setHistory(
        addHistoryEntry(history, config, {
          status: result.response.status,
          durationMs: result.response.durationMs,
          size: result.response.size,
        }),
      );
    }
    setLoading(false);
  }

  function loadFromHistory(entry: HistoryEntry) {
    setConfig({ ...entry.request });
  }

  function clearAllHistory() {
    clearHistory();
    setHistory([]);
  }

  function deleteHistory(id: string) {
    setHistory(removeHistoryEntry(history, id));
  }

  function updateConfig<K extends keyof HttpRequestConfig>(
    key: K,
    value: HttpRequestConfig[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  const activeParamsCount = config.params.filter(
    (p) => p.enabled && p.key.trim(),
  ).length;
  const activeHeadersCount = config.headers.filter(
    (p) => p.enabled && p.key.trim(),
  ).length;
  const hasBody = config.bodyType !== "none" && config.body.trim().length > 0;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* URL Bar */}
      <div className="flex items-center gap-2">
        <Select
          value={config.method}
          onValueChange={(v) => updateConfig("method", v as HttpMethod)}
        >
          <SelectTrigger className="h-9 w-28 shrink-0 text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m} className="text-xs font-semibold">
                <span className={METHOD_COLORS[m]}>{m}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={config.url}
          onChange={(e) => updateConfig("url", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) sendRequest();
          }}
          placeholder="https://api.example.com/endpoint"
          spellCheck={false}
          className="h-9 flex-1 font-mono text-xs"
        />
        <Button
          size="sm"
          onClick={sendRequest}
          disabled={loading || !config.url.trim()}
          className="h-9 shrink-0 gap-1.5"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {loading ? "Sending" : "Send"}
        </Button>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Left: Request config */}
        <ResizablePanel defaultSize={40} minSize={25} className="p-2">
          <Tabs defaultValue="params" className="flex h-full flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="params" className="text-xs">
                Params
                {activeParamsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 px-1 text-[10px]"
                  >
                    {activeParamsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers" className="text-xs">
                Headers
                {activeHeadersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 px-1 text-[10px]"
                  >
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
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 px-1 text-[10px]"
                  >
                    {history.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Params */}
            <TabsContent
              value="params"
              className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-1 pb-4">
                  <KeyValueEditor
                    pairs={config.params}
                    onChange={(params: KeyValue[]) =>
                      updateConfig("params", params)
                    }
                    keyPlaceholder="param name"
                    valuePlaceholder="value"
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Headers */}
            <TabsContent
              value="headers"
              className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-1 pb-4">
                  <KeyValueEditor
                    pairs={config.headers}
                    onChange={(headers: KeyValue[]) =>
                      updateConfig("headers", headers)
                    }
                    keyPlaceholder="Header-Name"
                    valuePlaceholder="header value"
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Body */}
            <TabsContent
              value="body"
              className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <div className="flex h-full flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={config.bodyType}
                    onValueChange={(v) =>
                      updateConfig("bodyType", v as BodyType)
                    }
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
                    onChange={(e) => updateConfig("body", e.target.value)}
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

            {/* History */}
            <TabsContent
              value="history"
              className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <div className="flex h-full flex-col gap-2">
                {history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllHistory}
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
                            onClick={() => loadFromHistory(entry)}
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
                            onClick={() => deleteHistory(entry.id)}
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
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        {/* Right: Response */}
        <ResizablePanel defaultSize={60} minSize={30} className="p-2">
          <div className="flex h-full flex-col gap-2">
            {/* Empty / Loading / Error states */}
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

            {/* Response content */}
            {response && !loading && (
              <>
                {/* Status bar */}
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
                        onClick={() => copy(response.body)}
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

                {/* Response tabs */}
                <Tabs
                  defaultValue="body"
                  className="flex min-h-0 flex-1 flex-col"
                >
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
                        {Object.entries(response.headers).map(
                          ([key, value]) => (
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
                          ),
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
