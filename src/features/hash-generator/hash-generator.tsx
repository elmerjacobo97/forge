import { useCallback, useMemo, useState } from "react"
import { Check, Copy, Eraser, Hash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"

import { type Algo, ALGOS, digest } from "./utils/hash"

interface HashResult {
  algo: Algo
  label: string
  bits: number
  hash: string
}

export function HashGenerator() {
  const [input, setInput] = useState("")
  const [selected, setSelected] = useState<Algo>("sha-256")
  const [results, setResults] = useState<HashResult[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { copied, copy } = useCopy()

  const current = useMemo(
    () => results.find((r) => r.algo === selected),
    [results, selected]
  )

  const generate = useCallback(async () => {
    if (!input) return
    setLoading(true)
    try {
      const entries = await Promise.all(
        ALGOS.map(async (algo) => ({
          algo: algo.id,
          label: algo.label,
          bits: algo.bits,
          hash: await digest(algo.id, input),
        }))
      )
      setResults(entries)
    } finally {
      setLoading(false)
    }
  }, [input])

  function copyOne(value: string, key: string) {
    copy(value)
    setCopiedKey(key)
  }

  function clear() {
    setInput("")
    setResults([])
    setCopiedKey(null)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={selected}
          onValueChange={(v) => v && setSelected(v as Algo)}
          variant="outline"
          size="sm"
        >
          {ALGOS.map((a) => (
            <ToggleGroupItem key={a.id} value={a.id}>
              {a.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {current && (
          <Badge variant="secondary" className="border-primary/30 text-primary/80">
            {current.bits} bits
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          {current && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyOne(current.hash, current.algo)}
                >
                  {copied && copiedKey === current.algo ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied && copiedKey === current.algo ? "Copied" : "Copy hash"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy {current.label} hash</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" onClick={clear} disabled={!input}>
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={generate} disabled={!input || loading}>
            <Hash className="size-3.5" />
            {loading ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Input text</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash…"
          spellCheck={false}
          className="min-h-24 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
        />
      </div>

      {results.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-xl border bg-muted/20">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              All hashes
            </span>
            <Badge variant="ghost" className="text-[10px] text-muted-foreground">
              {results.length}
            </Badge>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <ul className="flex flex-col">
              {results.map((r) => (
                <li
                  key={r.algo}
                  className="group flex items-center gap-3 border-b border-border/40 px-3 py-2 last:border-0"
                >
                  <div className="flex w-24 shrink-0 items-center gap-1.5">
                    <span className="font-mono text-xs font-medium">{r.label}</span>
                  </div>
                  <code className="flex-1 truncate font-mono text-xs text-muted-foreground">
                    {r.hash}
                  </code>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => copyOne(r.hash, r.algo)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Copy ${r.label}`}
                  >
                    {copied && copiedKey === r.algo ? (
                      <Check className="size-3 text-primary" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Press Generate to compute all hashes
          </p>
        </div>
      )}
    </div>
  )
}
