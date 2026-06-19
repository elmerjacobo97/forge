import { useEffect, useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getTool, tools } from "@/lib/tools"

export function AppShell() {
  const [activeId, setActiveId] = useState(tools[0].id)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const tool = getTool(activeId) ?? tools[0]
  const ToolComponent = tool.component

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === "k") {
          event.preventDefault()
          setPaletteOpen((open) => !open)
          setShortcutsOpen(false)
        } else if (event.key === "/") {
          event.preventDefault()
          setShortcutsOpen((open) => !open)
          setPaletteOpen(false)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Sidebar activeId={tool.id} onSelect={setActiveId} />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header tool={tool} onOpenPalette={() => setPaletteOpen(true)} />
          <div className="min-h-0 flex-1 p-4 md:p-5">
            <ToolComponent />
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelectTool={setActiveId}
      />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </TooltipProvider>
  )
}
