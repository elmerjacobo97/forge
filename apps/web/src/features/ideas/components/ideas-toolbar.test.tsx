// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/ideas",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("./add-idea-dialog", () => ({
  AddIdeaDialog: () => null,
}));

import type { IdeaFilters } from "@/features/ideas/schemas/idea-filters";
import { IdeasToolbar } from "./ideas-toolbar";

function makeFilters(overrides: Partial<IdeaFilters> = {}): IdeaFilters {
  return { q: "", status: "all", category: "all", tag: "all", ...overrides };
}

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Search ideas…") as HTMLInputElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("IdeasToolbar search", () => {
  it("navigates once with the final query after typing", () => {
    render(
      <IdeasToolbar
        filters={makeFilters()}
        tags={[]}
      />,
    );
    const input = getInput();

    fireEvent.change(input, { target: { value: "c" } });
    fireEvent.change(input, { target: { value: "co" } });
    fireEvent.change(input, { target: { value: "cof" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/ideas?q=cof");
  });

  it("keeps deleted characters when a previous navigation lands", () => {
    const { rerender } = render(
      <IdeasToolbar
        filters={makeFilters()}
        tags={[]}
      />,
    );
    const input = getInput();

    fireEvent.change(input, { target: { value: "coffee" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(mocks.replace).toHaveBeenCalledWith("/ideas?q=coffee");

    fireEvent.change(input, { target: { value: "coffe" } });
    rerender(
      <IdeasToolbar
        filters={makeFilters({ q: "coffee" })}
        tags={[]}
      />,
    );

    expect(input.value).toBe("coffe");
  });

  it("adopts external URL changes", () => {
    const { rerender } = render(
      <IdeasToolbar
        filters={makeFilters()}
        tags={[]}
      />,
    );
    const input = getInput();

    rerender(
      <IdeasToolbar
        filters={makeFilters({ q: "external" })}
        tags={[]}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(input.value).toBe("external");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
