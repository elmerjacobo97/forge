import { useCallback, useState } from "react"
import { Check, Copy, Eraser, Fingerprint, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"

type UuidVersion = "v4" | "v7"

function generateV4(): string {
  return crypto.randomUUID()
}

function generateV7(): string {
  const ts = Date.now()
  const random = new Uint8Array(10)
  crypto.getRandomValues(random)

  const bytes = new Uint8Array(16)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, Math.floor(ts / 0x10000))
  view.setUint16(4, ts & 0xffff)
  bytes[6] = 0x70 | (random[0] & 0x0f)
  bytes[7] = random[1]
  bytes[8] = 0x80 | (random[2] & 0x3f)
  bytes[9] = random[3]
  for (let i = 10; i < 16; i++) bytes[i] = random[i - 6]

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"))
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`
}

function formatUuid(uuid: string, uppercase: boolean, hyphens: boolean): string {
  let out = hyphens ? uuid : uuid.replace(/-/g, "")
  if (uppercase) out = out.toUpperCase()
  return out
}

export function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>("v4")
  const [count, setCount] = useState(1)
  const [uppercase, setUppercase] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [results, setResults] = useState<string[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const generate = useCallback(() => {
    const fn = version === "v4" ? generateV4 : generateV7
    const raw = Array.from({ length: Math.min(count, 100) }, () => fn())
    setResults(raw)
  }, [version, count])

  function copyOne(idx: number) {
    copy(formatUuid(results[idx], uppercase, hyphens))
    setCopiedKey(String(idx))
  }

  function copyAll() {
    copy(results.map((u) => formatUuid(u, uppercase, hyphens)).join("\n"))
    setCopiedKey("all")
  }

  function handleCountChange(value: string) {
    const n = Number(value)
    if (Number.isFinite(n)) setCount(Math.max(1, Math.min(100, Math.floor(n))))
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={version}
          onValueChange={(v) => v && setVersion(v as UuidVersion)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="v4">
            <Fingerprint className="size-3.5" />
            v4
          </ToggleGroupItem>
          <ToggleGroupItem value="v7">
            <Fingerprint className="size-3.5" />
            v7
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Count</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => handleCountChange(e.target.value)}
            aria-label="Count"
            className="h-8 w-20 text-xs"
          />
        </div>

        <Toggle
          size="sm"
          variant="outline"
          pressed={uppercase}
          onPressedChange={setUppercase}
          aria-label="Uppercase"
        >
          ABC
        </Toggle>
        <Toggle
          size="sm"
          variant="outline"
          pressed={hyphens}
          onPressedChange={setHyphens}
          aria-label="Hyphens"
        >
          -
        </Toggle>

        <div className="ml-auto flex items-center gap-2">
          {results.length > 0 && (
            <Badge variant="secondary" className="border-primary/30 text-primary/80">
              {results.length}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={copyAll} disabled={!results.length}>
                {copied && copiedKey === "all" ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied && copiedKey === "all" ? "Copied" : "Copy all"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy all to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setResults([])}
                disabled={!results.length}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={generate}>
            <RefreshCw className="size-3.5" />
            Generate
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 rounded-xl border bg-muted/20">
        {results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Press Generate to create UUIDs
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="flex flex-col">
              {results.map((uuid, idx) => {
                const formatted = formatUuid(uuid, uppercase, hyphens)
                return (
                  <li
                    key={uuid}
                    className="group flex items-center gap-3 border-b border-border/40 px-3 py-2 last:border-0"
                  >
                    <span className="w-6 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                      {idx + 1}
                    </span>
                    <code className="flex-1 truncate font-mono text-xs">{formatted}</code>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => copyOne(idx)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Copy"
                    >
                      {copied && copiedKey === String(idx) ? (
                        <Check className="size-3 text-primary" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
