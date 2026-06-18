import { useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getTool, tools } from "@/lib/tools"

export function AppShell() {
  const [activeId, setActiveId] = useState(tools[0].id)
  const tool = getTool(activeId) ?? tools[0]
  const ToolComponent = tool.component

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Sidebar activeId={tool.id} onSelect={setActiveId} />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header tool={tool} />
          <div className="min-h-0 flex-1 p-4 md:p-5">
            <ToolComponent />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
