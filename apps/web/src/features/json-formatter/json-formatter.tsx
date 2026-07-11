import { useMemo, useState } from "react";
import { Check, Copy, Eraser, Minimize2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCopy } from "@/lib/hooks/use-copy";

type Indent = 2 | 4 | "tab";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<Indent>(2);
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");
  const { copied, copy } = useCopy();

  const { output, error, valid } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null, valid: null };
    try {
      const parsed = JSON.parse(input);
      const space = indent === "tab" ? "\t" : indent;
      const result =
        mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, space);
      return { output: result, error: null, valid: true };
    } catch (e) {
      return { output: "", error: (e as Error).message, valid: false };
    }
  }, [input, indent, mode]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "pretty" | "minify")}
        >
          <TabsList>
            <TabsTrigger value="pretty">
              <Sparkles className="size-3.5" />
              Format
            </TabsTrigger>
            <TabsTrigger value="minify">
              <Minimize2 className="size-3.5" />
              Minify
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "pretty" && (
          <ToggleGroup
            type="single"
            value={String(indent)}
            onValueChange={(v) => v && setIndent((v === "tab" ? "tab" : Number(v)) as Indent)}
            variant="outline"
            size="sm"
          >
            {([2, 4, "tab"] as Indent[]).map((v) => (
              <ToggleGroupItem
                key={v}
                value={String(v)}
              >
                {v === "tab" ? "Tab" : `${v} sp`}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        <div className="ml-auto flex items-center gap-2">
          {valid !== null && (
            <Badge
              variant={valid ? "secondary" : "destructive"}
              className={valid ? "border-primary/30 text-primary/80" : undefined}
            >
              {valid ? "Valid JSON" : "Invalid"}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => output && copy(output)}
                disabled={!output}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy output to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setInput("")}
                disabled={!input}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear input</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          defaultSize={50}
          minSize={25}
          className="p-2"
        >
          <div className="flex h-full flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Input</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"hello":"world","numbers":[1,2,3]}'
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-transparent"
        />

        <ResizablePanel
          defaultSize={50}
          minSize={25}
          className="p-2"
        >
          <div className="flex h-full flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Output</Label>
            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <Badge variant="destructive">Parse error</Badge>
                <p className="text-center font-mono text-xs text-destructive">{error}</p>
              </div>
            ) : (
              <Textarea
                value={output}
                readOnly
                placeholder="Formatted JSON will appear here…"
                spellCheck={false}
                className="min-h-0 flex-1 resize-none rounded-xl border-input/60 bg-muted/30 font-mono text-xs leading-relaxed"
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
