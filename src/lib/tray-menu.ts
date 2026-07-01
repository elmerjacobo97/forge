import type { Router } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { tools } from "@/lib/tools";

// Groups the tools registry by category and ships it to the Rust tray so
// the tray menu never drifts out of sync with what's actually registered.
function buildCategories() {
  const byCategory = new Map<string, { path: string; name: string }[]>();
  for (const tool of tools) {
    const list = byCategory.get(tool.category) ?? [];
    list.push({ path: tool.path, name: tool.name });
    byCategory.set(tool.category, list);
  }
  return Array.from(byCategory, ([name, tools]) => ({ name, tools }));
}

export async function initTrayMenu(router: Router<any, any>): Promise<void> {
  try {
    await invoke("update_tray_menu", { categories: buildCategories() });
    await listen<string>("navigate", (event) => {
      void router.navigate({ to: event.payload });
    });
  } catch {
    // Tray plugin unavailable (web-only dev via `pnpm dev`, no Tauri runtime).
    // Silent: feature gracefully no-ops outside the native shell.
  }
}
