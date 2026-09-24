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

vi.mock("@/features/resources/components/add-resource-dialog", () => ({
  AddResourceDialog: () => null,
}));

import type { ResourceFilters } from "@/features/resources/schemas/resources-schema";
import { ResourcesToolbar } from "./resources-toolbar";

function makeFilters(overrides: Partial<ResourceFilters> = {}): ResourceFilters {
  return { q: "", category: "all", ...overrides };
}

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Search resources...") as HTMLInputElement;
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
    render(<ResourcesToolbar filters={makeFilters()} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "r" } });
    fireEvent.change(input, { target: { value: "re" } });
    fireEvent.change(input, { target: { value: "rea" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/resources?q=rea");
  });

  it("keeps deleted characters when a previous navigation lands", () => {
    const { rerender } = render(<ResourcesToolbar filters={makeFilters()} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "react" } });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(mocks.replace).toHaveBeenCalledWith("/resources?q=react");

    fireEvent.change(input, { target: { value: "reac" } });
    rerender(<ResourcesToolbar filters={makeFilters({ q: "react" })} />);

    expect(input.value).toBe("reac");
  });

  it("adopts external URL changes", () => {
    const { rerender } = render(<ResourcesToolbar filters={makeFilters()} />);
    const input = getInput();

    rerender(<ResourcesToolbar filters={makeFilters({ q: "external" })} />);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(input.value).toBe("external");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
