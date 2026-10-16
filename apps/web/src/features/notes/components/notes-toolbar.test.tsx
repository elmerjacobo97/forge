// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/notes",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("./add-note-dialog", () => ({
  AddNoteDialog: () => null,
}));

import type { NoteFilters } from "../schemas/note-filters";
import { NotesToolbar } from "./notes-toolbar";

function makeFilters(overrides: Partial<NoteFilters> = {}): NoteFilters {
  return { q: "", tag: "all", project: "all", ...overrides };
}

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Search notes…") as HTMLInputElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NotesToolbar", () => {
  it("renders project and tag filters", () => {
    render(
      <NotesToolbar
        filters={makeFilters()}
        tags={[]}
        projects={[]}
      />,
    );

    for (const label of ["Filter by project", "Filter by tag"]) {
      expect(screen.getByRole("combobox", { name: label })).toBeTruthy();
    }
  });

  it("navigates once with the final query after typing", () => {
    render(
      <NotesToolbar
        filters={makeFilters({ tag: "expo" })}
        tags={["expo"]}
        projects={[]}
      />,
    );

    fireEvent.change(getInput(), { target: { value: "router" } });
    act(() => {
      vi.runAllTimers();
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/notes?q=router&tag=expo");
  });
});
