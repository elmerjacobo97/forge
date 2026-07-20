"use client";

import { useMemo, useState } from "react"
import { Check, Copy, Eraser, GitCompare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useCopy } from "@/lib/hooks/use-copy"
import {
  computeLineDiff,
  diffStats,
  formatDiff,
} from "@/features/diff-tool/utils/diff"

export function DiffTool() {
  const [original, setOriginal] = useState("")
  const [modified, setModified] = useState("")
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const { copied, copy } = useCopy()

  const lines = useMemo(
    () => computeLineDiff(original, modified, { ignoreWhitespace }),
    [original, modified, ignoreWhitespace]
  )
  const stats = useMemo(() => diffStats(lines), [lines])
  const diffText = useMemo(() => formatDiff(lines), [lines])

  function handleCopy() {
    if (!diffText) return
    copy(diffText)
  }

  function handleSwap() {
    setOriginal(modified)
    setModified(original)
  }

  function handleClear() {
    setOriginal("")
    setModified("")
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          size="sm"
          variant="outline"
          pressed={ignoreWhitespace}
          onPressedChange={setIgnoreWhitespace}
          aria-label="Ignore whitespace"
        >
          Ignore whitespace
        </Toggle>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="outline" onClick={handleSwap} disabled={!original && !modified}>
              <GitCompare className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Swap sides</TooltipContent>
        </Tooltip>

        {(original || modified) && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              +{stats.added}
            </Badge>
            <Badge variant="secondary" className="border-rose-500/30 text-rose-600 dark:text-rose-400">
              -{stats.removed}
            </Badge>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={handleCopy} disabled={!diffText}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy diff"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy diff to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" onClick={handleClear} disabled={!original && !modified}>
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear both</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={50} minSize={20}>
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={20} className="p-2">
              <div className="flex h-full flex-col gap-1.5">
                <Label htmlFor="diff-original" className="text-xs font-medium text-muted-foreground">
                  Original
                </Label>
                <Textarea
                  id="diff-original"
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder="Original text…"
                  spellCheck={false}
                  className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-transparent" />

            <ResizablePanel defaultSize={50} minSize={20} className="p-2">
              <div className="flex h-full flex-col gap-1.5">
                <Label htmlFor="diff-modified" className="text-xs font-medium text-muted-foreground">
                  Modified
                </Label>
                <Textarea
                  id="diff-modified"
                  value={modified}
                  onChange={(e) => setModified(e.target.value)}
                  placeholder="Modified text…"
                  spellCheck={false}
                  className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={50} minSize={20} className="p-2">
          <div className="flex h-full flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Diff</Label>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-input/60 bg-muted/20">
              {lines.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">Enter text in both sides to see the diff</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line) => (
                        <tr
                          key={`${line.type}-${line.oldNumber ?? "none"}-${line.newNumber ?? "none"}`}
                          className={
                            line.type === "added"
                              ? "bg-emerald-500/10"
                              : line.type === "removed"
                                ? "bg-rose-500/10"
                                : ""
                          }
                        >
                          <td className="w-10 select-none border-r border-border/40 px-2 py-0.5 text-right font-mono text-[10px] text-muted-foreground">
                            {line.oldNumber ?? ""}
                          </td>
                          <td className="w-10 select-none border-r border-border/40 px-2 py-0.5 text-right font-mono text-[10px] text-muted-foreground">
                            {line.newNumber ?? ""}
                          </td>
                          <td className="w-6 select-none px-2 py-0.5 text-center font-mono text-[10px]">
                            {line.type === "added" ? (
                              <span className="text-emerald-600 dark:text-emerald-400">+</span>
                            ) : line.type === "removed" ? (
                              <span className="text-rose-600 dark:text-rose-400">-</span>
                            ) : (
                              <span className="text-muted-foreground"> </span>
                            )}
                          </td>
                          <td className="px-2 py-0.5 font-mono text-xs whitespace-pre">
                            {line.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
