"use client";

import { useMemo, useState } from "react"
import { ArrowDownUp, Check, Copy, Eraser } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useCopy } from "@/lib/hooks/use-copy"

type Mode = "encode" | "decode"

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function decodeBase64(b64: string): string {
  const clean = b64.replace(/\s/g, "")
  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function Base64Tool() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Mode>("encode")
  const { copied, copy } = useCopy()

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null }
    try {
      const result = mode === "encode" ? encodeBase64(input) : decodeBase64(input)
      return { output: result, error: null }
    } catch (e) {
      return { output: "", error: mode === "decode" ? "Invalid Base64 input" : (e as Error).message }
    }
  }, [input, mode])

  function handleCopy() {
    if (!output) return
    copy(output)
  }

  function handleSwap() {
    if (!output) return
    setInput(output)
    setMode(mode === "encode" ? "decode" : "encode")
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>
        </Tabs>

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
          <TooltipContent>Swap input/output</TooltipContent>
        </Tooltip>

        {output && (
          <Badge variant="secondary" className="border-primary/30 text-primary/80">
            {mode === "encode" ? "UTF-8 → Base64" : "Base64 → UTF-8"}
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
            <Label htmlFor="base64-input" className="text-xs font-medium text-muted-foreground">
              {mode === "encode" ? "Text" : "Base64"}
            </Label>
            <Textarea
              id="base64-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encode" ? "Enter text to encode…" : "Enter Base64 to decode…"}
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={50} minSize={20} className="p-2">
          <div className="flex h-full flex-col gap-1.5">
            <Label htmlFor="base64-output" className="text-xs font-medium text-muted-foreground">
              {mode === "encode" ? "Base64" : "Text"}
            </Label>
            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <Badge variant="destructive">Error</Badge>
                <p className="text-center font-mono text-xs text-destructive">{error}</p>
              </div>
            ) : (
              <Textarea
                id="base64-output"
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
