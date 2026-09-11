// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  pending: false,
  replace: vi.fn(),
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/bookmarks",
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.searchParams),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useTransition: () => [
      mocks.pending,
      (callback: () => void) => {
        callback();
      },
    ],
  };
});

import { ListPagination } from "./list-pagination";

beforeEach(() => {
  mocks.pending = false;
  mocks.replace.mockClear();
  mocks.searchParams = "";
});

describe("ListPagination", () => {
  it("renders the counter with the loaded and total counts", () => {
    render(
      <ListPagination
        loaded={10}
        total={25}
      />,
    );

    expect(screen.getByText("Showing 10 of 25")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
  });

  it("hides when everything is already loaded", () => {
    render(
      <ListPagination
        loaded={25}
        total={25}
      />,
    );

    expect(screen.queryByText(/Showing/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("increments visible by one page and preserves current params", () => {
    mocks.searchParams = "q=react&category=docs";
    render(
      <ListPagination
        loaded={12}
        total={30}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(mocks.replace).toHaveBeenCalledWith("/bookmarks?q=react&category=docs&visible=24", {
      scroll: false,
    });
  });

  it("increments from the current visible value", () => {
    mocks.searchParams = "visible=15";
    render(
      <ListPagination
        loaded={15}
        total={40}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(mocks.replace).toHaveBeenCalledWith("/bookmarks?visible=27", {
      scroll: false,
    });
  });

  it("marks the button busy and disabled while the transition is pending", () => {
    mocks.pending = true;
    render(
      <ListPagination
        loaded={10}
        total={25}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Load more",
    }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });
});
