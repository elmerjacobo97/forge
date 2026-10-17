import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlowStepKind, ProjectFlowStep } from "../types";

const KIND_STYLES: Record<FlowStepKind, string> = {
  page: "text-sky-700 dark:text-sky-300",
  ui: "text-violet-700 dark:text-violet-300",
  action: "text-primary",
  service: "text-emerald-700 dark:text-emerald-300",
  db: "text-amber-700 dark:text-amber-300",
  command: "text-muted-foreground",
  tool: "text-muted-foreground",
};

function location(step: ProjectFlowStep): string | null {
  if (!step.file) return null;
  return step.line ? `${step.file}:${step.line}` : step.file;
}

export function FlowSteps({ steps }: { steps: ProjectFlowStep[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step, index) => {
        const where = location(step);
        return (
          <li
            key={`${index}-${step.label}`}
            className="flex flex-col gap-1 border border-border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
              <Badge className={cn(KIND_STYLES[step.kind])}>{step.kind}</Badge>
              <span className="min-w-0 text-sm font-medium">{step.label}</span>
              {step.inferred && (
                <Badge
                  variant="outline"
                  title="Not backed by a graph edge; read from the code"
                  className="text-amber-700 dark:text-amber-300"
                >
                  inferred
                </Badge>
              )}
            </div>
            {(step.symbol || where) && (
              <p className="font-mono text-xs break-all text-muted-foreground">
                {step.symbol}
                {step.symbol && where ? " · " : ""}
                {where}
              </p>
            )}
            {step.input && <p className="text-xs">In: {step.input}</p>}
            {step.output && <p className="text-xs">Out: {step.output}</p>}
          </li>
        );
      })}
    </ol>
  );
}
