"use client";

import { useMemo, useState } from "react"
import { ArrowDownUp, Check, Copy, Eraser } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useCopy } from "@/lib/hooks/use-copy"
import {
  adapters,
  convert,
  formatIds,
  type FormatId,
} from "@/features/format-converter/utils/formats"

export function FormatConverter() {
  const [input, setInput] = useState("")
  const [source, setSource] = useState<FormatId>("json")
  const [target, setTarget] = useState<FormatId>("yaml")
  const { copied, copy } = useCopy()

  const { output, error } = useMemo(
    () => convert(input, source, target),
    [input, source, target]
  )

  function handleCopy() {
    if (!output) return
    copy(output)
  }

  function handleSwap() {
    if (!output) return
    setInput(output)
    setSource(target)
    setTarget(source)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Select value={source} onValueChange={(v) => setSource(v as FormatId)}>
            <SelectTrigger className="w-32" aria-label="Source format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {adapters[id].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">to</span>

          <Select value={target} onValueChange={(v) => setTarget(v as FormatId)}>
            <SelectTrigger className="w-32" aria-label="Target format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {adapters[id].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={handleSwap}
              disabled={!output}
            >
              <ArrowDownUp className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Swap formats</TooltipContent>
        </Tooltip>

        {output && source !== target && (
          <Badge variant="secondary" className="border-primary/30 text-primary/80">
            {adapters[source].name} → {adapters[target].name}
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={handleCopy} disabled={!output}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy output</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" onClick={() => setInput("")} disabled={!input}>
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={50} minSize={20} className="p-2">
          <div className="flex h-full flex-col gap-1.5">
            <Label htmlFor="format-input" className="text-xs font-medium text-muted-foreground">
              {adapters[source].name}
            </Label>
            <Textarea
              id="format-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter ${adapters[source].name}…`}
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={50} minSize={20} className="p-2">
          <div className="flex h-full flex-col gap-1.5">
            <Label htmlFor="format-output" className="text-xs font-medium text-muted-foreground">
              {adapters[target].name}
            </Label>
            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <Badge variant="destructive">Error</Badge>
                <p className="text-center font-mono text-xs text-destructive">{error}</p>
              </div>
            ) : (
              <Textarea
                id="format-output"
                value={output}
                readOnly
                placeholder="Result will appear here…"
                spellCheck={false}
                className="min-h-0 flex-1 resize-none rounded-xl border-input/60 bg-muted/30 font-mono text-xs leading-relaxed"
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
