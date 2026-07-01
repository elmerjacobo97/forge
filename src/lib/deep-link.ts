import type { Router } from "@tanstack/react-router";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { tools } from "@/lib/tools";

// Parse a `forge://...` URL into an internal router path.
// `forge://dev-board`       -> /dev-board
// `forge:///dev-board`      -> /dev-board
// `forge://forge/dev-board` -> /dev-board (host = scheme identifier on some OS)
function parseDeepLink(url: string): string | null {
  try {
    const u = new URL(url);
    // Supported forms: forge://dev-board, forge:///dev-board, forge://forge/dev-board
    const path = u.pathname.replace(/^\/+/, "");
    if (path) {
      const candidate = `/${path}`;
      if (tools.some((t) => t.path === candidate)) return candidate;
    }
    // Some OS versions put the first segment in host
    const host = u.host;
    if (host) {
      const candidate = `/${host}`;
      if (tools.some((t) => t.path === candidate)) return candidate;
    }
  } catch {
    // ignore malformed
  }
  return null;
}

export async function initDeepLink(router: Router<any, any>): Promise<void> {
  try {
    // URLs that launched the app (cold start)
    const initial = await getCurrent();
    if (initial && initial.length > 0) {
      for (const url of initial) {
        const path = parseDeepLink(url);
        if (path) {
          await router.navigate({ to: path });
          break;
        }
      }
    }

    // URLs arriving while the app is running
    await onOpenUrl((urls: string[]) => {
      for (const url of urls) {
        const path = parseDeepLink(url);
        if (path) {
          void router.navigate({ to: path });
          break;
        }
      }
    });
  } catch {
    // Deep-link plugin unavailable (web-only dev via `pnpm dev`, no Tauri runtime).
    // Silent: feature gracefully no-ops outside the native shell.
  }
}