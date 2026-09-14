"use client";

import { useEffect } from "react";

import { insforge } from "@/lib/insforge/browser";
import {
  COMMENT_EVENT,
  TICKET_EVENT,
  parseCommentChange,
  parseTicketChange,
  type CommentChange,
  type TicketChange,
} from "../utils/board-realtime";

export interface BoardRealtimeHandlers {
  onTicketChange: (change: TicketChange) => void;
  onCommentChange: (change: CommentChange) => void;
}

/**
 * Subscribes to the signed-in user's Dev Board channel. Events patch the board
 * in place; the SDK reconnects and resubscribes on its own after drops.
 * Handlers must be stable (useCallback) to avoid resubscribing every render.
 */
export function useBoardRealtime(userId: string, handlers: BoardRealtimeHandlers) {
  const { onTicketChange, onCommentChange } = handlers;

  useEffect(() => {
    const channel = `dev-board:${userId}`;
    let cancelled = false;

    const handleTicket = (payload: unknown) => {
      const change = parseTicketChange(payload);
      if (change) onTicketChange(change);
    };

    const handleComment = (payload: unknown) => {
      const change = parseCommentChange(payload);
      if (change) onCommentChange(change);
    };

    insforge.realtime.on(TICKET_EVENT, handleTicket);
    insforge.realtime.on(COMMENT_EVENT, handleComment);

    insforge.realtime.subscribe(channel).then(
      (response) => {
        if (!cancelled && !response.ok) {
          console.warn(
            `[dev-board] realtime subscribe failed: ${response.error?.message ?? "unknown error"}`,
          );
        }
      },
      (error: unknown) => {
        if (!cancelled) console.warn("[dev-board] realtime connection failed", error);
      },
    );

    return () => {
      cancelled = true;
      insforge.realtime.off(TICKET_EVENT, handleTicket);
      insforge.realtime.off(COMMENT_EVENT, handleComment);
      insforge.realtime.unsubscribe(channel);
    };
  }, [userId, onTicketChange, onCommentChange]);
}
