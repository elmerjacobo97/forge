// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { useClock } from "./use-clock";

const T0 = Date.parse("2026-09-12T10:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useClock", () => {
  it("returns null during server rendering", () => {
    function Probe() {
      const now = useClock();
      return <span>{now === null ? "no-clock" : "clock"}</span>;
    }

    expect(renderToString(<Probe />)).toContain("no-clock");
  });

  it("ticks every second while active", () => {
    const { result, unmount } = renderHook(() => useClock());

    expect(result.current).toBe(T0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(T0 + 1000);

    unmount();
  });

  it("stays inactive when not subscribed", () => {
    const { result, unmount } = renderHook(() => useClock(false));

    expect(result.current).toBeNull();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toBeNull();

    unmount();
  });

  it("stops the shared interval when the last subscriber unmounts", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const first = renderHook(() => useClock());
    const second = renderHook(() => useClock());
    first.unmount();

    expect(clearIntervalSpy).not.toHaveBeenCalled();

    second.unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
