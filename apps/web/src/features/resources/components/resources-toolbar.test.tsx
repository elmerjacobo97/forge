// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/resources",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("./add-resource-dialog", () => ({
  AddResourceDialog: () => null,
}));

import type { ResourceFilters } from "@/features/resources/schemas/resource-filters";
import { ResourcesToolbar } from "./resources-toolbar";

function makeFilters(overrides: Partial<ResourceFilters> = {}): ResourceFilters {
  return { q: "", kind: "all", tool: "all", format: "all", tag: "all", ...overrides };
}

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Search resources…") as HTMLInputElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ResourcesToolbar search", () => {
  it("navigates once with the final query after typing", () => {
    render(
      <ResourcesToolbar
        filters={makeFilters()}
        tags={[]}
      />,
    );
    const input = getInput();

    fireEvent.change(input, { target: { value: "c" } });
    fireEvent.change(input, { target: { value: "co" } });
    fireEvent.change(input, { target: { value: "con" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/resources?q=con");
  });

  it("keeps deleted characters when a previous navigation lands", () => {
    const { rerender } = render(
      <ResourcesToolbar
        filters={makeFilters()}
        tags={[]}
      />,
    );
    const input = getInput();

    fireEvent.change(input, { target: { value: "config" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(mocks.replace).toHaveBeenCalledWith("/resources?q=config");

    fireEvent.change(input, { target: { value: "confi" } });
    rerender(
      <ResourcesToolbar
        filters={makeFilters({ q: "config" })}
        tags={[]}
      />,
    );

    expect(input.value).toBe("confi");
  });

  it("adopts external URL changes", () => {
    const { rerender } = render(
      <ResourcesToolbar
        filters={makeFilters()}
        tags={[]}
      />,
    );
    const input = getInput();

    rerender(
      <ResourcesToolbar
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
