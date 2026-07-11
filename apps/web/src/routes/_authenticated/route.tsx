import { Suspense, useEffect, useState } from "react";
import {
  Outlet,
  createFileRoute,
  redirect,
  isRedirect,
  useRouterState,
} from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { tools, getToolByPath } from "@/lib/tools";
import { userQueryOptions } from "@/features/auth/hooks/queries";

function ToolSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-px flex-1 animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
}

function AuthenticatedLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // derive active tool from current path
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    try {
      const user = await context.queryClient.ensureQueryData(userQueryOptions);
      if (!user) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
    } catch (err) {
      if (isRedirect(err)) {
        throw err;
      }
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});
