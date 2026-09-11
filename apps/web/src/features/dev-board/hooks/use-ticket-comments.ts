"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { TicketComment } from "../types/board";

interface TicketCommentsState {
  ticketId: string | null;
  comments: TicketComment[];
  error: string | null;
}

const EMPTY_COMMENTS: TicketComment[] = [];

function parseCommentsResponse(response: Response): Promise<TicketComment[]> {
  if (!response.ok) {
    return response
      .json()
      .catch(() => null)
      .then((body: { error?: string } | null) => {
        throw new Error(body?.error ?? "Failed to load comments.");
      });
  }

  return response.json().then((body: { comments: TicketComment[] }) => body.comments);
}

export function useTicketComments(ticketId: string | null) {
  const [state, setState] = useState<TicketCommentsState>({
    ticketId: null,
    comments: EMPTY_COMMENTS,
    error: null,
  });
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!ticketId) return;

    const activeId = ticketId;
    const requestId = ++requestRef.current;

    fetch(`/api/dev-board/tickets/${encodeURIComponent(activeId)}/comments`)
      .then(parseCommentsResponse)
      .then((comments) => {
        if (requestRef.current === requestId) {
          setState({ ticketId: activeId, comments, error: null });
        }
      })
      .catch((error: unknown) => {
        if (requestRef.current !== requestId) return;
        setState({
          ticketId: activeId,
          comments: EMPTY_COMMENTS,
          error: error instanceof Error ? error.message : "Failed to load comments.",
        });
      });
  }, [ticketId]);

  const appendComment = useCallback((comment: TicketComment) => {
    setState((current) => ({ ...current, comments: [...current.comments, comment] }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!ticketId) {
    return { comments: EMPTY_COMMENTS, isLoading: false, error: null, appendComment };
  }

  const isCurrent = state.ticketId === ticketId;
  return {
    comments: isCurrent ? state.comments : EMPTY_COMMENTS,
    isLoading: !isCurrent,
    error: isCurrent ? state.error : null,
    appendComment,
  };
}
