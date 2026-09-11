"use client";

import { useEffect, useState } from "react";

import type { AnalyticsData, AnalyticsRange } from "../types/analytics";

interface AnalyticsState {
  key: string;
  data: AnalyticsData;
  error: string | null;
}

const EMPTY_ANALYTICS: AnalyticsData = { tickets: [], events: [], timeEntries: [] };

function rangeKey(range: AnalyticsRange): string {
  return `${range.from}|${range.to}`;
}

function parseAnalyticsResponse(response: Response): Promise<AnalyticsData> {
  if (!response.ok) {
    return response
      .json()
      .catch(() => null)
      .then((body: { error?: string } | null) => {
        throw new Error(body?.error ?? "Failed to load analytics.");
      });
  }

  return response.json().then((body: { analytics: AnalyticsData }) => body.analytics);
}

export function useAnalytics(
  projectId: string,
  range: AnalyticsRange | undefined,
  initialRange: AnalyticsRange,
  initialAnalytics: AnalyticsData,
) {
  const [state, setState] = useState<AnalyticsState>({
    key: rangeKey(initialRange),
    data: initialAnalytics,
    error: null,
  });

  useEffect(() => {
    if (!range) return;

    const activeRange = range;
    const controller = new AbortController();
    const key = rangeKey(activeRange);

    fetch(
      `/api/dev-board/projects/${projectId}/analytics?from=${encodeURIComponent(activeRange.from)}&to=${encodeURIComponent(activeRange.to)}`,
      { signal: controller.signal },
    )
      .then(parseAnalyticsResponse)
      .then((data) => setState({ key, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          data: EMPTY_ANALYTICS,
          error: error instanceof Error ? error.message : "Failed to load analytics.",
        });
      });

    return () => controller.abort();
  }, [projectId, range]);

  if (!range) {
    return { data: null, error: null, isLoading: false };
  }

  const isCurrent = state.key === rangeKey(range);
  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    isLoading: !isCurrent,
  };
}
