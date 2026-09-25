import { beforeEach, describe, expect, it, vi } from "vitest";

const cookies = vi.hoisted(() => vi.fn());
const signInWithOAuth = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  }),
);

vi.mock("next/headers", () => ({ cookies }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@insforge/sdk/ssr", () => ({ createAuthActions: () => ({ signInWithOAuth }) }));

import { signInWithGitHubAction } from "./actions";

const cookieStore = { set: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  cookies.mockResolvedValue(cookieStore);
  process.env.NEXT_PUBLIC_APP_URL = "https://forge.example";
  signInWithOAuth.mockResolvedValue({
    data: { url: "https://auth.insforge.app/oauth", codeVerifier: "pkce-verifier" },
    error: null,
  });
});

describe("signInWithGitHubAction", () => {
  it("starts GitHub OAuth and stores only short-lived httpOnly flow cookies", async () => {
    await expect(signInWithGitHubAction("/tickets?filter=open")).rejects.toThrow(
      "REDIRECT:https://auth.insforge.app/oauth",
    );

    expect(signInWithOAuth).toHaveBeenCalledWith("github", {
      redirectTo: "https://forge.example/api/auth/callback",
      skipBrowserRedirect: true,
    });
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      "insforge_code_verifier",
      "pkce-verifier",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 }),
    );
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      2,
      "forge_oauth_redirect",
      "/tickets?filter=open",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 }),
    );
  });

  it("uses the safe default redirect for an external destination", async () => {
    await expect(signInWithGitHubAction("//evil.example")).rejects.toThrow();
    expect(cookieStore.set).toHaveBeenCalledWith(
      "forge_oauth_redirect",
      "/dev-board",
      expect.any(Object),
    );
  });

  it("returns a safe error if OAuth cannot start", async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: new Error("private provider detail") });

    await expect(signInWithGitHubAction()).resolves.toEqual({
      ok: false,
      message: "Unable to start GitHub sign-in. Please try again.",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("handles a rejected OAuth initialization without writing cookies", async () => {
    signInWithOAuth.mockRejectedValueOnce(new Error("network failure"));

    await expect(signInWithGitHubAction()).resolves.toEqual({
      ok: false,
      message: "Unable to start GitHub sign-in. Please try again.",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("fails clearly when the public app URL is not configured", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    await expect(signInWithGitHubAction()).resolves.toEqual({
      ok: false,
      message: "GitHub sign-in is not configured.",
    });
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });
});
