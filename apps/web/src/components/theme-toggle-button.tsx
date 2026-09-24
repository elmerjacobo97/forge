"use client";

import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
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
            <span
              className="size-4"
              aria-hidden
            />
          ) : isDark ? (
            <HugeiconsIcon
              icon={Sun01Icon}
              strokeWidth={2}
              className="size-4"
            />
          ) : (
            <HugeiconsIcon
              icon={Moon01Icon}
              strokeWidth={2}
              className="size-4"
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {!isClient ? "Toggle theme" : isDark ? "Light mode" : "Dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
