"use client";

import { useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useCopy } from "@/lib/hooks/use-copy";
import { DEFAULT_CONFIG } from "./http-tester-shared";
import { RequestConfigPanel } from "./request-config-panel";
import { RequestUrlBar } from "./request-url-bar";
import { ResponsePanel } from "./response-panel";
import {
  type HttpRequestConfig,
  type HistoryEntry,
  type HttpResponseData,
  addHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from "./utils/history";
import { executeRequest } from "./utils/request";

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

    try {
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
    } finally {
      setLoading(false);
    }
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
      <RequestUrlBar
        config={config}
        loading={loading}
        onMethodChange={(method) => updateConfig("method", method)}
        onUrlChange={(url) => updateConfig("url", url)}
        onSend={sendRequest}
      />

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={40} minSize={25} className="p-2">
          <RequestConfigPanel
            config={config}
            history={history}
            activeParamsCount={activeParamsCount}
            activeHeadersCount={activeHeadersCount}
            hasBody={hasBody}
            onParamsChange={(params) => updateConfig("params", params)}
            onHeadersChange={(headers) => updateConfig("headers", headers)}
            onBodyTypeChange={(bodyType) => updateConfig("bodyType", bodyType)}
            onBodyChange={(body) => updateConfig("body", body)}
            onLoadFromHistory={loadFromHistory}
            onClearHistory={clearAllHistory}
            onDeleteHistory={deleteHistory}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={60} minSize={30} className="p-2">
          <ResponsePanel
            response={response}
            error={error}
            loading={loading}
            copied={copied}
            onCopy={copy}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
