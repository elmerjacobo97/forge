import { Suspense, useEffect, useState } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { tools, getToolByPath } from "@/lib/tools";
import type { AuthState } from "@/lib/auth";
import type { QueryClient } from "@tanstack/react-query";

function ToolSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-px flex-1 animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
}

export interface RouterContext {
  auth: AuthState;
  queryClient: QueryClient;
}

function RootLayout() {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // derive active tool from current path
  const pathname = router.state.location.pathname;
  const tool = getToolByPath(pathname) ?? tools[0];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === "k") {
          event.preventDefault();
          setPaletteOpen((open) => !open);
          setShortcutsOpen(false);
        } else if (event.key === "/") {
          event.preventDefault();
          setShortcutsOpen((open) => !open);
          setPaletteOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Sidebar activePath={pathname} />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header tool={tool} onOpenPalette={() => setPaletteOpen(true)} />
          <div className="min-h-0 flex-1 p-4 md:p-5">
            <Suspense fallback={<ToolSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <Toaster position="bottom-right" closeButton />
    </TooltipProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});