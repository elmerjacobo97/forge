// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const signInAction = vi.hoisted(() => vi.fn());
const signInWithGitHubAction = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({ signInAction, signInWithGitHubAction }));

import { LoginForm } from "./login-form";

beforeEach(() => {
  vi.clearAllMocks();
  signInAction.mockResolvedValue({ ok: false, message: "Invalid credentials." });
  signInWithGitHubAction.mockResolvedValue({
    ok: false,
    message: "Unable to start GitHub sign-in. Please try again.",
  });
});

describe("LoginForm", () => {
  it("offers GitHub and preserves email/password sign-in", async () => {
    render(<LoginForm redirectTo="/dev-board?tab=mine" />);

    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    const githubButton = screen.getByRole("button", { name: "Continue with GitHub" });
    expect(githubButton.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(githubButton.querySelector("svg")?.getAttribute("fill")).toBe("currentColor");
    fireEvent.click(githubButton);
    await waitFor(() => expect(signInWithGitHubAction).toHaveBeenCalledWith("/dev-board?tab=mine"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Unable to start GitHub sign-in.",
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secure-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(signInAction).toHaveBeenCalledWith(
        { email: "dev@example.com", password: "secure-password" },
        "/dev-board?tab=mine",
      ),
    );
  });

  it("shows a specific message for an unverified GitHub email", () => {
    render(<LoginForm oauthError="github_email_unverified" />);

    expect(screen.getByRole("alert").textContent).toContain(
      "GitHub did not provide a verified email address.",
    );
  });

  it("shows a loading state while GitHub sign-in is starting", async () => {
    let finishOAuth!: (result: { ok: false; message: string }) => void;
    signInWithGitHubAction.mockReturnValue(
      new Promise((resolve) => {
        finishOAuth = resolve;
      }),
    );
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(
      (await screen.findByRole("button", { name: "Connecting to GitHub..." })).hasAttribute(
        "disabled",
      ),
    ).toBe(true);

    finishOAuth({ ok: false, message: "Unable to start GitHub sign-in. Please try again." });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Continue with GitHub" }).hasAttribute("disabled"),
      ).toBe(false),
    );
  });
});
