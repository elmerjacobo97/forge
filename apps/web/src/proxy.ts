import { NextResponse, type NextRequest } from "next/server";
import { updateSession, type CookieOptions, type CookieStore } from "@insforge/sdk/ssr/middleware";

type CookieInput = { name: string; value: string } & CookieOptions;
type CookieDeleteInput = { name: string } & CookieOptions;

const protectedPathPrefixes = [
  "/bookmarks",
  "/dev-board",
  "/ideas",
  "/resources",
  "/uptime-monitor",
  "/webhook-inspector",
] as const;

function isProtectedPath(pathname: string): boolean {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function requestCookieAdapter(request: NextRequest): CookieStore {
  return {
    get: (name) => request.cookies.get(name),
    set: (...args: [string, string, CookieOptions?] | [CookieInput]) => {
      if (typeof args[0] === "string") {
        const value = args[1];
        if (value !== undefined) request.cookies.set(args[0], value);
      } else request.cookies.set(args[0].name, args[0].value);
    },
    delete: (...args: [string] | [CookieDeleteInput]) => {
      request.cookies.delete(typeof args[0] === "string" ? args[0] : args[0].name);
    },
  };
}

type RecordedCookie = { name: string; value: string; options?: CookieOptions };

function recordingCookieStore(recorded: RecordedCookie[]): CookieStore {
  return {
    get: () => undefined,
    set: (...args: [string, string, CookieOptions?] | [CookieInput]) => {
      if (typeof args[0] === "string") {
        recorded.push({ name: args[0], value: args[1] ?? "", options: args[2] });
      } else {
        const { name, value, ...options } = args[0];
        recorded.push({ name, value, options });
      }
    },
    delete: (...args: [string] | [CookieDeleteInput]) => {
      const name = typeof args[0] === "string" ? args[0] : args[0].name;
      recorded.push({ name, value: "", options: { maxAge: 0 } });
    },
  };
}

export async function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("insforge_access_token") || request.cookies.has("insforge_refresh_token");

  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/dev-board" : "/login", request.url));
  }

  if (!hasSession && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const recordedCookies: RecordedCookie[] = [];
  await updateSession({
    requestCookies: requestCookieAdapter(request),
    responseCookies: recordingCookieStore(recordedCookies),
  });

  const response = NextResponse.next({ request });
  for (const cookie of recordedCookies) {
    response.cookies.set({ name: cookie.name, value: cookie.value, ...cookie.options });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
