import { NextResponse, type NextRequest } from "next/server";
import {
  updateSession,
  type CookieOptions,
  type CookieStore,
} from "@insforge/sdk/ssr/middleware";

type CookieInput = { name: string; value: string } & CookieOptions;
type CookieDeleteInput = { name: string } & CookieOptions;

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

function responseCookieAdapter(response: NextResponse): CookieStore {
  return {
    get: (name) => response.cookies.get(name),
    set: (...args: [string, string, CookieOptions?] | [CookieInput]) => {
      if (typeof args[0] === "string") {
        const value = args[1];
        if (value !== undefined) response.cookies.set(args[0], value, args[2]);
      } else response.cookies.set(args[0]);
    },
    delete: (...args: [string] | [CookieDeleteInput]) => {
      if (typeof args[0] === "string") response.cookies.delete(args[0]);
      else response.cookies.delete({ name: args[0].name, path: args[0].path });
    },
  };
}

export async function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("insforge_access_token") ||
    request.cookies.has("insforge_refresh_token");
  const isPublicPath =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/verify-email" ||
    request.nextUrl.pathname.startsWith("/api/");

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    if (request.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next({ request });
  await updateSession({
    requestCookies: requestCookieAdapter(request),
    responseCookies: responseCookieAdapter(response),
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
