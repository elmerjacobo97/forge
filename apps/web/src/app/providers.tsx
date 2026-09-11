"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="forge-theme"
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
