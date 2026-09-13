// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useUrlSearch } from "./use-url-search";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function settle() {
  act(() => {
    vi.advanceTimersByTime(250);
  });
}

describe("useUrlSearch", () => {
  it("commits once per settled draft", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    act(() => result.current.setValue("r"));
    act(() => result.current.setValue("re"));
    settle();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("re");
    expect(result.current.value).toBe("re");

    rerender({ query: "", commit: vi.fn() });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("does not commit while the debounce is still settling", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    act(() => result.current.setValue("a"));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.setValue("ab"));
    settle();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("ab");
  });

  it("releases the draft once the URL catches up", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    act(() => result.current.setValue("ab"));
    settle();
    rerender({ query: "ab", commit: onCommit });

    rerender({ query: "external", commit: onCommit });

    expect(result.current.value).toBe("external");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("adopts external URL changes while idle", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    rerender({ query: "external", commit: onCommit });
    settle();

    expect(result.current.value).toBe("external");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("keeps typed text when a stale URL lands", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    act(() => result.current.setValue("react"));
    settle();

    act(() => result.current.setValue("reac"));
    rerender({ query: "react", commit: onCommit });

    expect(result.current.value).toBe("reac");
    expect(onCommit).toHaveBeenCalledTimes(1);

    settle();
    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenLastCalledWith("reac");
  });

  it("does not recommit when the URL lands with a trimmed value", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    act(() => result.current.setValue("ab "));
    settle();
    expect(onCommit).toHaveBeenCalledWith("ab ");

    rerender({ query: "ab", commit: onCommit });

    expect(result.current.value).toBe("ab");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("lets external navigation supersede a pending commit", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ query, commit }) => useUrlSearch(query, commit), {
      initialProps: { query: "", commit: onCommit },
    });

    act(() => result.current.setValue("ab"));
    settle();

    rerender({ query: "back", commit: onCommit });

    expect(result.current.value).toBe("back");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
