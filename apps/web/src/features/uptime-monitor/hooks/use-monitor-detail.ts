"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UPTIME_POLL_INTERVAL_MS } from "../constants";
import type { LatencyRange, MonitorDetailData } from "../types";
import { usePageVisible } from "./use-page-visible";

interface MonitorDetailState {
  range: LatencyRange;
  data: MonitorDetailData;
  error: string | null;
}

function parseDetailResponse(response: Response): Promise<MonitorDetailData> {
  if (!response.ok) {
    return response
      .json()
      .catch(() => null)
      .then((body: { error?: string } | null) => {
        throw new Error(body?.error ?? "Failed to load monitor detail.");
      });
  }

  return response.json().then((body: { detail: MonitorDetailData }) => body.detail);
}

export function useMonitorDetail(
  monitorId: string,
  range: LatencyRange,
  initialDetail: MonitorDetailData,
  intervalMinutes: number,
) {
  const visible = usePageVisible();
  const [state, setState] = useState<MonitorDetailState>({
    range: "24h",
    data: initialDetail,
    error: null,
  });
  const requestRef = useRef(0);

  const pollMs = Math.max(UPTIME_POLL_INTERVAL_MS, (intervalMinutes * 60_000) / 2);

  const load = useCallback(() => {
    const requestId = ++requestRef.current;

    fetch(
      `/api/uptime/monitors/${encodeURIComponent(monitorId)}?range=${encodeURIComponent(range)}`,
    )
      .then(parseDetailResponse)
      .then((data) => {
        if (requestRef.current === requestId) setState({ range, data, error: null });
      })
      .catch((error: unknown) => {
        if (requestRef.current !== requestId) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "Failed to load monitor detail.",
        }));
      });
  }, [monitorId, range]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs, visible]);

  const isCurrent = state.range === range;
  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    isLoading: !isCurrent,
  };
}
