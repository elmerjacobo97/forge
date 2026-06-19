import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Copy, Eraser, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"
import {
  clampCount,
  generateLorem,
  type OutputFormat,
  type Unit,
} from "@/features/lorem-ipsum/utils/lorem"

const UNITS: { id: Unit; label: string }[] = [
  { id: "words", label: "Words" },
  { id: "sentences", label: "Sentences" },
  { id: "paragraphs", label: "Paragraphs" },
]

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "html", label: "HTML" },
  { id: "markdown", label: "Markdown" },
  { id: "json", label: "JSON" },
]

export function LoremIpsum() {
  const [unit, setUnit] = useState<Unit>("paragraphs")
  const [count, setCount] = useState(3)
  const [format, setFormat] = useState<OutputFormat>("plain")
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [seed, setSeed] = useState(0)
  const { copied, copy } = useCopy()

  const output = useMemo(
    () => generateLorem({ unit, count: clampCount(unit, count), startWithLorem, format }),
    [unit, count, startWithLorem, format, seed]
  )

  const regenerate = useCallback(() => setSeed((s) => s + 1), [])

  useEffect(() => {
    regenerate()
  }, [unit, count, startWithLorem, format])

  function handleCountChange(value: string) {
    const n = Number(value)
    if (Number.isFinite(n)) setCount(clampCount(unit, n))
  }

  function handleUnitChange(value: Unit) {
    setUnit(value)
    setCount((c) => clampCount(value, c))
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={unit}
          onValueChange={(v) => v && handleUnitChange(v as Unit)}
          variant="outline"
          size="sm"
        >
          {UNITS.map((u) => (
            <ToggleGroupItem key={u.id} value={u.id}>
              {u.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Count</Label>
          <Input
            type="number"
            min={1}
            max={unit === "words" ? 1000 : unit === "sentences" ? 100 : 50}
            value={count}
            onChange={(e) => handleCountChange(e.target.value)}
            aria-label="Count"
            className="h-8 w-20 text-xs"
          />
        </div>

        <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
          <SelectTrigger className="h-8 w-32" aria-label="Output format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Toggle
          size="sm"
          variant="outline"
          pressed={startWithLorem}
          onPressedChange={setStartWithLorem}
          aria-label="Start with Lorem ipsum"
        >
          Lorem ipsum…
        </Toggle>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => copy(output)} disabled={!output}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy output</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" onClick={() => setCount(unit === "words" ? 50 : unit === "sentences" ? 5 : 3)}>
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset count</TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={regenerate}>
            <RefreshCw className="size-3.5" />
            Regenerate
          </Button>
        </div>
      </div>

      <Textarea
        value={output}
        readOnly
        placeholder="Generated text will appear here…"
        spellCheck={false}
        className="min-h-0 flex-1 resize-none rounded-xl border-input/60 bg-muted/30 font-mono text-xs leading-relaxed"
      />
    </div>
  )
}
