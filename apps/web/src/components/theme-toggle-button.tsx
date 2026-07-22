"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="text-muted-foreground"
          aria-label="Toggle theme"
          disabled={!isClient}
        >
          {!isClient ? (
            <span className="size-4" aria-hidden />
          ) : isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {!isClient ? "Toggle theme" : isDark ? "Light mode" : "Dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
