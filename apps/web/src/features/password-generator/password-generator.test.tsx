// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CRYPTO_UNAVAILABLE_ERROR } from "./utils/password";
import { PasswordGenerator } from "./password-generator";

const originalClipboard = navigator.clipboard;

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PasswordGenerator", () => {
  it("generates an initial 20-character password", async () => {
    render(<PasswordGenerator />);

    const output = await screen.findByRole("status", {
      name: "Generated password",
    });

    expect(output.textContent).toMatch(/^\S{20}$/);
  });

  it("regenerates one password without reloading", async () => {
    render(<PasswordGenerator />);

    const output = await screen.findByRole("status", {
      name: "Generated password",
    });
    const initialPassword = output.textContent;

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() => {
      expect(output.textContent).not.toBe(initialPassword);
    });
  });

  it("keeps the result and shows a pending-options warning", async () => {
    render(<PasswordGenerator />);

    const output = await screen.findByRole("status", {
      name: "Generated password",
    });
    const initialPassword = output.textContent;
    fireEvent.change(screen.getByLabelText("Length"), {
      target: { value: "24" },
    });

    expect(output.textContent).toBe(initialPassword);
    expect(screen.getByText("Options changed. Regenerate to apply them.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() => {
      expect(output.textContent).toMatch(/^\S{24}$/);
      expect(screen.queryByText("Options changed. Regenerate to apply them.")).toBeNull();
    });
  });

  it("confirms a successful clipboard copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<PasswordGenerator />);

    const output = await screen.findByRole("status", {
      name: "Generated password",
    });
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
    });
    expect(writeText).toHaveBeenCalledWith(output.textContent);
  });

  it("shows an inline error when clipboard copy fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<PasswordGenerator />);

    const output = await screen.findByRole("status", {
      name: "Generated password",
    });
    const password = output.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Clipboard permission denied");
    expect(output.textContent).toBe(password);
  });

  it("explains when secure random generation is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    render(<PasswordGenerator />);

    expect((await screen.findByRole("alert")).textContent).toContain(CRYPTO_UNAVAILABLE_ERROR);
    expect(screen.getByRole("status", { name: "Generated password" }).textContent).toContain(
      "No password generated",
    );
  });
});
