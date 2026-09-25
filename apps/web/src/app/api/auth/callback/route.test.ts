import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const exchangeOAuthCode = vi.hoisted(() => vi.fn());
const captureAuthOptions = vi.hoisted(() => vi.fn());

vi.mock("@insforge/sdk/ssr", () => ({
  createAuthActions: (options: unknown) => {
    captureAuthOptions(options);
    return { exchangeOAuthCode };
  },
}));

import { GET } from "./route";

function callbackRequest(query = "?insforge_code=oauth-code", cookies = "") {
  const headers = cookies ? { cookie: cookies } : undefined;
  return new NextRequest(`http://localhost:3000/api/auth/callback${query}`, { headers });
}

const verifiedUser = {
  id: "user-1",
  email: "dev@example.com",
  emailVerified: true,
  profile: { name: "Dev" },
};

beforeEach(() => {
  vi.clearAllMocks();
  exchangeOAuthCode.mockResolvedValue({ data: { user: verifiedUser }, error: null });
});

describe("OAuth callback", () => {
  it("exchanges the code and returns to the validated destination, clearing flow cookies", async () => {
    const request = callbackRequest(
      "?insforge_code=oauth-code",
      "insforge_code_verifier=pkce-verifier; forge_oauth_redirect=%2Fwork%3Ftab%3Dopen",
    );

    const response = await GET(request);

    expect(exchangeOAuthCode).toHaveBeenCalledWith("oauth-code", "pkce-verifier");
    expect(response.headers.get("location")).toBe("http://localhost:3000/work?tab=open");
    expect(response.headers.get("set-cookie")).toContain("insforge_code_verifier=");
    expect(response.headers.get("set-cookie")).toContain("forge_oauth_redirect=");
  });

  it("falls back to the board when the redirect cookie is external", async () => {
    const request = callbackRequest(
      "?insforge_code=oauth-code",
      "insforge_code_verifier=pkce-verifier; forge_oauth_redirect=%2F%2Fevil.example",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dev-board");
  });

  it("returns to login without exchanging when the code or verifier is missing", async () => {
    const missingCode = await GET(callbackRequest("", "insforge_code_verifier=pkce-verifier"));
    const missingVerifier = await GET(callbackRequest("?insforge_code=oauth-code"));

    expect(missingCode.headers.get("location")).toBe(
      "http://localhost:3000/login?error=oauth_failed",
    );
    expect(missingVerifier.headers.get("location")).toBe(
      "http://localhost:3000/login?error=oauth_failed",
    );
    expect(exchangeOAuthCode).not.toHaveBeenCalled();
  });

  it("rejects OAuth errors and missing or unverified email addresses", async () => {
    const cancelled = await GET(
      callbackRequest("?error=access_denied", "insforge_code_verifier=verifier"),
    );
    expect(cancelled.headers.get("location")).toBe(
      "http://localhost:3000/login?error=github_cancelled",
    );

    exchangeOAuthCode.mockResolvedValueOnce({
      data: { user: { ...verifiedUser, email: "  " } },
      error: null,
    });
    const missingEmail = await GET(
      callbackRequest("?insforge_code=oauth-code", "insforge_code_verifier=verifier"),
    );
    expect(missingEmail.headers.get("location")).toBe(
      "http://localhost:3000/login?error=github_email_unverified",
    );

    exchangeOAuthCode.mockResolvedValueOnce({
      data: { user: { ...verifiedUser, emailVerified: false } },
      error: null,
    });
    const unverifiedEmail = await GET(
      callbackRequest("?insforge_code=oauth-code", "insforge_code_verifier=verifier"),
    );
    expect(unverifiedEmail.headers.get("location")).toBe(
      "http://localhost:3000/login?error=github_email_unverified",
    );
  });

  it("does not return a partially established session if the exchanged email is unverified", async () => {
    exchangeOAuthCode.mockImplementationOnce(async () => {
      const calls = captureAuthOptions.mock.calls;
      const options = calls[calls.length - 1]?.[0] as {
        responseCookies: { set: (name: string, value: string) => void };
      };
      options.responseCookies.set("insforge_refresh_token", "session-token");
      return { data: { user: { ...verifiedUser, emailVerified: false } }, error: null };
    });

    const response = await GET(
      callbackRequest("?insforge_code=oauth-code", "insforge_code_verifier=verifier"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=github_email_unverified",
    );
    expect(response.headers.get("set-cookie")).not.toContain(
      "insforge_refresh_token=session-token",
    );
  });

  it("clears the temporary cookies when the code exchange throws", async () => {
    exchangeOAuthCode.mockRejectedValueOnce(new Error("network failure"));

    const response = await GET(
      callbackRequest("?insforge_code=oauth-code", "insforge_code_verifier=verifier"),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=oauth_failed");
    expect(response.headers.get("set-cookie")).toContain("insforge_code_verifier=");
    expect(response.headers.get("set-cookie")).toContain("forge_oauth_redirect=");
  });

  it("returns a clear failure when the code exchange fails", async () => {
    exchangeOAuthCode.mockResolvedValue({ data: null, error: new Error("provider detail") });

    const response = await GET(
      callbackRequest("?insforge_code=oauth-code", "insforge_code_verifier=verifier"),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=oauth_failed");
    expect(response.headers.get("set-cookie")).toContain("insforge_code_verifier=");
    expect(response.headers.get("set-cookie")).toContain("forge_oauth_redirect=");
  });
});
