"use client";

import { useMemo, useState } from "react"
import { Check, Copy, Eraser } from "lucide-react"

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
import { useCopy } from "@/lib/hooks/use-copy"

import { transform, type Op } from "./utils/transform"

const OPS: { id: Op; label: string }[] = [
  { id: "upper", label: "UPPER" },
  { id: "lower", label: "lower" },
  { id: "title", label: "Title Case" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "trim", label: "Trim" },
  { id: "sort-asc", label: "Sort A→Z" },
  { id: "sort-desc", label: "Sort Z→A" },
  { id: "unique", label: "Unique" },
  { id: "reverse-lines", label: "Reverse" },
]

export function TextManipulator() {
  const [input, setInput] = useState("")
  const [op, setOp] = useState<Op>("upper")
  const { copied, copy } = useCopy()

  const output = useMemo(() => transform(op, input), [op, input])

  const stats = useMemo(() => {
    if (!input) return null
    const lines = input.split("\n").length
    const chars = input.length
    const words = input.trim() ? input.trim().split(/\s+/).length : 0
    return { lines, chars, words }
  }, [input])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="text-op" className="text-xs text-muted-foreground">
            Operation
          </Label>
          <Select value={op} onValueChange={(v) => setOp(v as Op)}>
            <SelectTrigger id="text-op" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {stats && (
          <div className="flex items-center gap-2">
            <Badge variant="ghost" className="text-[10px] text-muted-foreground">
              {stats.lines} lines
            </Badge>
            <Badge variant="ghost" className="text-[10px] text-muted-foreground">
              {stats.words} words
            </Badge>
            <Badge variant="ghost" className="text-[10px] text-muted-foreground">
              {stats.chars} chars
            </Badge>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(output)}
                disabled={!output}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy output</TooltipContent>
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
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-1.5">
          <Label
            htmlFor="text-input"
            className="text-xs font-medium text-muted-foreground"
          >
            Input
          </Label>
          <Textarea
            id="text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text…"
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
          />
        </div>
        <div className="flex min-h-0 flex-col gap-1.5">
          <Label
            htmlFor="text-output"
            className="text-xs font-medium text-muted-foreground"
          >
            Output
          </Label>
          <Textarea
            id="text-output"
            value={output}
            readOnly
            placeholder="Transformed text will appear here…"
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-xl border-input/60 bg-muted/30 font-mono text-xs leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}
