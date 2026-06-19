import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Copy, Eraser, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "@/components/ui/menubar"
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

  function handleUnitChange(value: string) {
    const next = value as Unit
    setUnit(next)
    setCount((c) => clampCount(next, c))
  }

  function resetAll() {
    setUnit("paragraphs")
    setCount(3)
    setFormat("plain")
    setStartWithLorem(true)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Unit</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value={unit} onValueChange={handleUnitChange}>
                {UNITS.map((u) => (
                  <MenubarRadioItem key={u.id} value={u.id}>
                    {u.label}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Format</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
                {FORMATS.map((f) => (
                  <MenubarRadioItem key={f.id} value={f.id}>
                    {f.label}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Options</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={startWithLorem}
                onCheckedChange={(v) => setStartWithLorem(v === true)}
              >
                Start with "Lorem ipsum…"
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

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

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => copy(output)} disabled={!output}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" onClick={resetAll}>
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset defaults</TooltipContent>
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
