import { useSyncExternalStore } from "react";

let currentTime: number | null = null;
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function emit() {
  currentTime = Date.now();

  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentTime = Date.now();
    intervalId = setInterval(emit, 1000);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

const noopSubscribe = () => () => {};

function getSnapshot(): number | null {
  return listeners.size === 0 ? null : currentTime;
}

function getServerSnapshot(): number | null {
  return null;
}

export function useClock(active = true): number | null {
  return useSyncExternalStore(active ? subscribe : noopSubscribe, getSnapshot, getServerSnapshot);
}
