// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dev-board",
  useRouter: () => navigation,
}));

import type { ProjectFilters } from "../schemas/project-filters";
import { ProjectListToolbar } from "./project-list-toolbar";

function makeFilters(overrides: Partial<ProjectFilters> = {}): ProjectFilters {
  return { q: "", status: "all", sort: "status", ...overrides };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.useRealTimers());

describe("ProjectListToolbar", () => {
  it("pushes the debounced search into the URL", () => {
    render(<ProjectListToolbar filters={makeFilters()} />);

    fireEvent.change(screen.getByPlaceholderText("Search projects…"), {
      target: { value: "forge" },
    });
    act(() => vi.advanceTimersByTime(250));

    expect(navigation.push).toHaveBeenCalledWith("/dev-board?q=forge");
  });

  it("uses the default input and select sizes", () => {
    render(<ProjectListToolbar filters={makeFilters()} />);

    expect(screen.getByPlaceholderText("Search projects…").classList.contains("text-xs")).toBe(
      false,
    );
    expect(
      screen.getByRole("combobox", { name: "Filter by project status" }).getAttribute("data-size"),
    ).toBe("default");
    expect(screen.getByRole("combobox", { name: "Sort projects" }).getAttribute("data-size")).toBe(
      "default",
    );
  });

  it("preserves the search while changing status and sort filters", async () => {
    const { rerender } = render(<ProjectListToolbar filters={makeFilters({ q: "forge" })} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Filter by project status" }));
    fireEvent.click(screen.getByRole("option", { name: "Archived" }));
    expect(navigation.push).toHaveBeenCalledWith("/dev-board?q=forge&status=archived");

    rerender(<ProjectListToolbar filters={makeFilters({ q: "forge", status: "archived" })} />);
    fireEvent.click(screen.getByRole("combobox", { name: "Sort projects" }));
    fireEvent.click(screen.getByRole("option", { name: "Name (A–Z)" }));
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/dev-board?q=forge&status=archived&sort=name",
    );
  });

  it("restores search and filter controls from updated URL-derived props", () => {
    const { rerender } = render(<ProjectListToolbar filters={makeFilters()} />);

    rerender(
      <ProjectListToolbar
        filters={makeFilters({ q: "board", status: "paused", sort: "created" })}
      />,
    );

    expect((screen.getByPlaceholderText("Search projects…") as HTMLInputElement).value).toBe(
      "board",
    );
    expect(
      screen.getByRole("combobox", { name: "Filter by project status" }).textContent?.trim(),
    ).toBe("Paused");
    expect(screen.getByRole("combobox", { name: "Sort projects" }).textContent?.trim()).toBe(
      "Newest first",
    );
  });
});
