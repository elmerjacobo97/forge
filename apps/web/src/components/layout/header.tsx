"use client"

import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import type { ToolDef } from "@/lib/tools"

interface HeaderProps {
  tool: ToolDef
  onOpenPalette: () => void
}

export function Header({ tool, onOpenPalette }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/85 px-5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-sm font-semibold leading-tight">
            {tool.name}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{tool.description}</p>
        </div>
        <Badge variant="outline" className="hidden shrink-0 border-primary/30 text-primary/80 sm:inline-flex">
          local
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onOpenPalette}
              className="text-muted-foreground"
              aria-label="Open command palette"
            >
              <Search className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Command palette</TooltipContent>
        </Tooltip>
        <ThemeToggleButton />
      </div>
    </header>
  )
}
