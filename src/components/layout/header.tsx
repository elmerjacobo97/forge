import { Keyboard, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"
import type { ToolDef } from "@/lib/tools"

interface HeaderProps {
  tool: ToolDef
}

export function Header({ tool }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || theme === "system"

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-5 pl-14 md:pl-5">
      <div className="flex min-w-0 items-center gap-3">
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
            <Button size="icon-sm" variant="ghost" className="text-muted-foreground">
              <Keyboard className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="text-muted-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
