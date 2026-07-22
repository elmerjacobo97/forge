"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AuthUserProvider } from "@/features/auth/components/auth-user-provider";
import type { AuthUser } from "@/features/auth/types";
import { getToolByPath, tools } from "@/lib/tools";

export function AuthenticatedShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const tool = getToolByPath(pathname) ?? tools[0];

  useEffect(() => {
    queryClient.setQueryData(["session"], user);
  }, [queryClient, user]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.metaKey && !event.ctrlKey) return;
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AuthUserProvider user={user}>
      <SidebarProvider>
        <AppSidebar activePath={pathname} user={user} />
        <SidebarInset className="min-w-0 bg-background text-foreground">
          <Header tool={tool} onOpenPalette={() => setPaletteOpen(true)} />
          <main className="min-h-0 flex-1 p-4 md:p-5">{children}</main>
        </SidebarInset>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </SidebarProvider>
    </AuthUserProvider>
  );
}
