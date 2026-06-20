import { Suspense, useEffect, useState, useTransition } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getTool, tools } from "@/lib/tools";

function ToolSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-px flex-1 animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
}

export function AppShell() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tool = getTool(activeId) ?? tools[0];
  const ToolComponent = tool.component;

  function selectTool(id: string) {
    startTransition(() => {
      setActiveId(id);
    });
  }

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
        <Sidebar activeId={tool.id} onSelect={selectTool} />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header tool={tool} onOpenPalette={() => setPaletteOpen(true)} />
          <div
            className={`min-h-0 flex-1 p-4 md:p-5 transition-opacity ${
              isPending ? "opacity-60" : "opacity-100"
            }`}
          >
            <Suspense fallback={<ToolSkeleton />}>
              <ToolComponent />
            </Suspense>
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelectTool={selectTool}
      />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </TooltipProvider>
  );
}
