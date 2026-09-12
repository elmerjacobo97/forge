"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getLastTimeEntryAction } from "../actions";
import type { TimeEntry } from "../types/analytics";

interface LastTimeEntryState {
  ticketId: string | null;
  entry: TimeEntry | null;
  error: string | null;
}

export function useLastTimeEntry(ticketId: string | null, enabled: boolean) {
  const [state, setState] = useState<LastTimeEntryState>({
    ticketId: null,
    entry: null,
    error: null,
  });
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!ticketId || !enabled) return;

    const activeId = ticketId;
    const requestId = ++requestRef.current;

    getLastTimeEntryAction(activeId)
      .then((result) => {
        if (requestRef.current !== requestId) return;
        if (!result.ok) {
          setState({ ticketId: activeId, entry: null, error: result.message });
          return;
        }
        setState({ ticketId: activeId, entry: result.data, error: null });
      })
      .catch((error: unknown) => {
        if (requestRef.current !== requestId) return;
        setState({
          ticketId: activeId,
          entry: null,
          error: error instanceof Error ? error.message : "Failed to load ticket time.",
        });
      });
  }, [ticketId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ticketId || !enabled) {
    return { entry: null, isLoading: false, error: null };
  }

  const isCurrent = state.ticketId === ticketId;
  return {
    entry: isCurrent ? state.entry : null,
    isLoading: !isCurrent,
    error: isCurrent ? state.error : null,
  };
}
