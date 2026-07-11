import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <AlertTriangle className="size-8 text-destructive" />
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-sm font-semibold text-foreground">Something went wrong</h2>
        <p className="max-w-sm text-xs text-muted-foreground">{error.message}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => reset()}
      >
        Reintentar
      </Button>
    </div>
  );
}
