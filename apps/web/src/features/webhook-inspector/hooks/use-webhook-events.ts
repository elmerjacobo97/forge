"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WEBHOOK_POLL_INTERVAL_MS } from "../constants";
import type { WebhookEvent } from "../types";
import { usePageVisible } from "./use-page-visible";

interface WebhookEventsState {
  endpointId: string | null;
  events: WebhookEvent[];
  error: string | null;
}

const EMPTY_EVENTS: WebhookEvent[] = [];

function parseEventsResponse(response: Response): Promise<WebhookEvent[]> {
  if (!response.ok) {
    return response
      .json()
      .catch(() => null)
      .then((body: { error?: string } | null) => {
        throw new Error(body?.error ?? "Failed to load webhook events.");
      });
  }

  return response.json().then((body: { events: WebhookEvent[] }) => body.events);
}

export function useWebhookEvents(endpointId: string | null) {
  const visible = usePageVisible();
  const [state, setState] = useState<WebhookEventsState>({
    endpointId: null,
    events: EMPTY_EVENTS,
    error: null,
  });
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!endpointId) return;

    const activeId = endpointId;
    const requestId = ++requestRef.current;

    fetch(`/api/webhook-events?endpointId=${encodeURIComponent(activeId)}`)
      .then(parseEventsResponse)
      .then((events) => {
        if (requestRef.current === requestId) {
          setState({ endpointId: activeId, events, error: null });
        }
      })
      .catch((error: unknown) => {
        if (requestRef.current !== requestId) return;
        setState({
          endpointId: activeId,
          events: EMPTY_EVENTS,
          error: error instanceof Error ? error.message : "Failed to load webhook events.",
        });
      });
  }, [endpointId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!endpointId || !visible) return;
    const interval = setInterval(load, WEBHOOK_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, endpointId, visible]);

  if (!endpointId) {
    return { events: EMPTY_EVENTS, isLoading: false, error: null };
  }

  const isCurrent = state.endpointId === endpointId;
  return {
    events: isCurrent ? state.events : EMPTY_EVENTS,
    isLoading: !isCurrent,
    error: isCurrent ? state.error : null,
  };
}
