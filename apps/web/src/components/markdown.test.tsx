// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("renders bold, inline code and lists", () => {
    render(<Markdown content={"**bold** and `code`\n\n- one\n- two"} />);

    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders GFM tables", () => {
    render(<Markdown content={"| a | b |\n| - | - |\n| 1 | 2 |"} />);

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("1").tagName).toBe("TD");
  });

  it("does not execute raw HTML", () => {
    const { container } = render(<Markdown content={'<script>alert("x")</script>'} />);

    expect(container.querySelector("script")).toBeNull();
  });

  it("preserves plain-text line breaks", () => {
    render(<Markdown content={"line one\nline two"} />);

    expect(screen.getByText(/line one/).textContent).toContain("\n");
  });

  it("opens links in a new tab with safe rel", () => {
    render(<Markdown content={"[Forge](https://example.com)"} />);

    const link = screen.getByRole("link", { name: "Forge" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
