// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/bookmarks",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/features/bookmarks/components/add-bookmark-dialog", () => ({
  AddBookmarkDialog: () => null,
}));

import type { BookmarkFilters } from "@/features/bookmarks/schemas/bookmarks-schema";
import { BookmarksToolbar } from "./bookmarks-toolbar";

function makeFilters(overrides: Partial<BookmarkFilters> = {}): BookmarkFilters {
  return { q: "", category: "all", ...overrides };
}

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Search bookmarks...") as HTMLInputElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BookmarksToolbar search", () => {
  it("navigates once with the final query after typing", () => {
    render(<BookmarksToolbar filters={makeFilters()} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "r" } });
    fireEvent.change(input, { target: { value: "re" } });
    fireEvent.change(input, { target: { value: "rea" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/bookmarks?q=rea");
  });

  it("keeps deleted characters when a previous navigation lands", () => {
    const { rerender } = render(<BookmarksToolbar filters={makeFilters()} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "react" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(mocks.replace).toHaveBeenCalledWith("/bookmarks?q=react");

    fireEvent.change(input, { target: { value: "reac" } });
    rerender(<BookmarksToolbar filters={makeFilters({ q: "react" })} />);

    expect(input.value).toBe("reac");
  });

  it("adopts external URL changes", () => {
    const { rerender } = render(<BookmarksToolbar filters={makeFilters()} />);
    const input = getInput();

    rerender(<BookmarksToolbar filters={makeFilters({ q: "external" })} />);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(input.value).toBe("external");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
