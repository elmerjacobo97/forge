import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import type { Env } from "./env.js";

const STATE_TTL_SECONDS = 600;
const STATE_COOKIE = "__Host-CONSENTED_STATE";
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

type OAuthEnv = Env & { OAUTH_PROVIDER: OAuthHelpers };

interface StoredState {
  oauthReqInfo: AuthRequest;
}

function randomState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stateKey(state: string): string {
  return `oauth:state:${state}`;
}

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    cookies.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }
  return cookies;
}

function sessionCookie(state: string): string {
  return `${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_TTL_SECONDS}`;
}

function clearSessionCookie(): string {
  return `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function htmlResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "set-cookie": clearSessionCookie() },
  });
}

async function exchangeCode(env: OAuthEnv, code: string, redirectUri: string): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!response.ok) throw new Error(`GitHub token exchange failed (${response.status}).`);

  const body = (await response.json()) as { access_token?: unknown; error_description?: unknown };
  if (typeof body.access_token !== "string" || body.access_token.length === 0) {
    const detail =
      typeof body.error_description === "string" ? body.error_description : "no access token";
    throw new Error(`GitHub token exchange failed: ${detail}`);
  }
  return body.access_token;
}

async function fetchGithubLogin(accessToken: string): Promise<string> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/vnd.github+json",
      "user-agent": "forge-mcp",
    },
  });
  if (!response.ok) throw new Error(`GitHub user lookup failed (${response.status}).`);

  const user = (await response.json()) as { login?: unknown };
  if (typeof user.login !== "string" || user.login.length === 0) {
    throw new Error("GitHub user lookup returned no login.");
  }
  return user.login;
}

function errorResponse(caught: unknown): Response {
  const maybeResponse = caught as { toResponse?: () => Response };
  if (typeof maybeResponse.toResponse === "function") return maybeResponse.toResponse();
  const message = caught instanceof Error ? caught.message : "Invalid authorization request.";
  return new Response(message, {
    status: 400,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

async function handleAuthorize(request: Request, env: OAuthEnv): Promise<Response> {
  let oauthReqInfo: AuthRequest;
  try {
    oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
  } catch (caught) {
    return errorResponse(caught);
  }
  if (!oauthReqInfo.clientId) return htmlResponse("Invalid authorization request.", 400);

  const state = randomState();
  await env.OAUTH_KV.put(stateKey(state), JSON.stringify({ oauthReqInfo }), {
    expirationTtl: STATE_TTL_SECONDS,
  });

  const redirect = new URL(GITHUB_AUTHORIZE_URL);
  redirect.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", new URL("/callback", request.url).href);
  redirect.searchParams.set("scope", "read:user");
  redirect.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: { location: redirect.href, "set-cookie": sessionCookie(state) },
  });
}

async function handleCallback(request: Request, env: OAuthEnv, url: URL): Promise<Response> {
  const error = url.searchParams.get("error");
  if (error) return htmlResponse(`GitHub authorization failed: ${error}.`, 400);

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookieState = parseCookies(request.headers.get("cookie")).get(STATE_COOKIE);

  if (!state || !code) return htmlResponse("Missing state or code.", 400);
  if (!cookieState || cookieState !== state) {
    return htmlResponse("OAuth state does not match this session.", 400);
  }

  const stored = await env.OAUTH_KV.get<StoredState>(stateKey(state), "json");
  await env.OAUTH_KV.delete(stateKey(state));
  if (!stored?.oauthReqInfo?.clientId) {
    return htmlResponse("OAuth state is missing or expired.", 400);
  }

  try {
    const accessToken = await exchangeCode(env, code, new URL("/callback", request.url).href);
    const login = await fetchGithubLogin(accessToken);
    if (login.toLowerCase() !== env.ALLOWED_GITHUB_LOGIN.trim().toLowerCase()) {
      return htmlResponse("This GitHub account is not allowed to use this server.", 403);
    }

    const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
      request: stored.oauthReqInfo,
      userId: login,
      scope: stored.oauthReqInfo.scope ?? [],
      metadata: { label: login },
      props: { login },
    });

    return new Response(null, {
      status: 302,
      headers: { location: redirectTo, "set-cookie": clearSessionCookie() },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unexpected error.";
    return htmlResponse(message, 500);
  }
}

export default {
  async fetch(request: Request, env: OAuthEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/authorize") {
      return handleAuthorize(request, env);
    }
    if (request.method === "GET" && url.pathname === "/callback") {
      return handleCallback(request, env, url);
    }
    return new Response("Not found", { status: 404 });
  },
};
