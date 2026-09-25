import { createAuthActions } from "@insforge/sdk/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/features/auth/oauth";

function loginErrorResponse(requestUrl: string, error: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/login?error=${error}`, requestUrl));
  response.cookies.delete("insforge_code_verifier");
  response.cookies.delete("forge_oauth_redirect");
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) return loginErrorResponse(request.url, "github_cancelled");
  if (!code) return loginErrorResponse(request.url, "oauth_failed");

  const codeVerifier = request.cookies.get("insforge_code_verifier")?.value;
  if (!codeVerifier) return loginErrorResponse(request.url, "oauth_failed");

  const redirectPath = safeRedirectPath(request.cookies.get("forge_oauth_redirect")?.value);
  const successResponse = NextResponse.redirect(new URL(redirectPath, request.url));
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: successResponse.cookies,
  });

  let exchangeResult;
  try {
    exchangeResult = await auth.exchangeOAuthCode(code, codeVerifier);
  } catch {
    return loginErrorResponse(request.url, "oauth_failed");
  }

  const { data, error } = exchangeResult;
  const user = data?.user;
  if (error || !user) return loginErrorResponse(request.url, "oauth_failed");
  if (typeof user.email !== "string" || !user.email.trim() || user.emailVerified !== true) {
    return loginErrorResponse(request.url, "github_email_unverified");
  }

  successResponse.cookies.delete("insforge_code_verifier");
  successResponse.cookies.delete("forge_oauth_redirect");
  return successResponse;
}
