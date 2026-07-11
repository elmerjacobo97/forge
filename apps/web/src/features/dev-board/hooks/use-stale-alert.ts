import { useEffect, useRef } from "react";
import type { Ticket } from "../types";
import { STALE_THRESHOLD_MS } from "../types";
import { computeElapsed, formatDuration } from "../utils/timer";

const ALERTED_KEY = "forge_devboard:alerted";

function loadAlerted(): Set<string> {
  try {
    const raw = sessionStorage.getItem(ALERTED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveAlerted(set: Set<string>): void {
  try {
    sessionStorage.setItem(ALERTED_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

function lastMoveAt(ticket: Ticket): number {
  if (ticket.history.length === 0) return new Date(ticket.createdAt).getTime();
  return new Date(ticket.history[ticket.history.length - 1].at).getTime();
}

async function notify(title: string, body: string): Promise<void> {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function useStaleAlert(tickets: Ticket[]): void {
  const alertedRef = useRef<Set<string>>(loadAlerted());

  useEffect(() => {
    const check = async () => {
      const now = Date.now();
      let changed = false;
      for (const t of tickets) {
        if (t.column !== "in_progress" || t.isPaused || !t.timerStartedAt) {
          if (alertedRef.current.has(t.id)) {
            alertedRef.current.delete(t.id);
            changed = true;
          }
          continue;
        }
        const sinceMove = now - lastMoveAt(t);
        if (sinceMove >= STALE_THRESHOLD_MS && !alertedRef.current.has(t.id)) {
          alertedRef.current.add(t.id);
          changed = true;
          const elapsed = computeElapsed(t, now);
          await notify("Ticket stale", `"${t.title}" in progress for ${formatDuration(elapsed)}. Update?`);
        }
      }
      if (changed) saveAlerted(alertedRef.current);
    };
    void check();
    const id = setInterval(() => void check(), 60_000);
    return () => clearInterval(id);
  }, [tickets]);
}
