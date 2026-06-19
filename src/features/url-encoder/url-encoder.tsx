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
import { decodeUrl, encodeUrl } from "@/features/url-encoder/utils/url"

type Mode = "encode" | "decode"

export function UrlEncoder() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Mode>("encode")
  const { copied, copy } = useCopy()

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null }
    if (mode === "encode") {
      return { output: encodeUrl(input), error: null }
    }
    return decodeUrl(input)
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
            {mode === "encode" ? "Text → URL" : "URL → Text"}
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
            <Label htmlFor="url-input" className="text-xs font-medium text-muted-foreground">
              {mode === "encode" ? "Text" : "Encoded URL"}
            </Label>
            <Textarea
              id="url-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "Enter text to encode…"
                  : "Enter encoded URL to decode…"
              }
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={50} minSize={20} className="p-2">
          <div className="flex h-full flex-col gap-1.5">
            <Label htmlFor="url-output" className="text-xs font-medium text-muted-foreground">
              {mode === "encode" ? "Encoded URL" : "Text"}
            </Label>
            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <Badge variant="destructive">Error</Badge>
                <p className="text-center font-mono text-xs text-destructive">{error}</p>
              </div>
            ) : (
              <Textarea
                id="url-output"
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
