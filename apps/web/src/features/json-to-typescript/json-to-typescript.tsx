"use client";

import { useMemo, useState } from "react"
import { Check, Copy, Eraser, FileCode } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { useCopy } from "@/lib/hooks/use-copy"
import { generateTypeScript, type OutputMode } from "@/features/json-to-typescript/utils/printer"

const MODES: { id: OutputMode; label: string }[] = [
  { id: "interface", label: "Interface" },
  { id: "type", label: "Type" },
]

const THRESHOLDS = [5, 10, 20] as const

export function JsonToTypescript() {
  const [input, setInput] = useState("")
  const [rootName, setRootName] = useState("Root")
  const [mode, setMode] = useState<OutputMode>("interface")
  const [optionalNulls, setOptionalNulls] = useState(true)
  const [detectDates, setDetectDates] = useState(true)
  const [enumInference, setEnumInference] = useState(true)
  const [enumThreshold, setEnumThreshold] = useState(10)
  const { copied, copy } = useCopy()

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null }
    return generateTypeScript(input, {
      mode,
      rootName: rootName.trim() || "Root",
      optionalNulls,
      detectDates,
      enumThreshold: enumInference ? enumThreshold : 0,
    })
  }, [input, rootName, mode, optionalNulls, detectDates, enumInference, enumThreshold])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Mode</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value={mode} onValueChange={(v) => setMode(v as OutputMode)}>
                {MODES.map((m) => (
                  <MenubarRadioItem key={m.id} value={m.id}>
                    {m.label}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Options</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={optionalNulls}
                onCheckedChange={(v) => setOptionalNulls(v === true)}
              >
                Optional nulls
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={detectDates}
                onCheckedChange={(v) => setDetectDates(v === true)}
              >
                Detect dates
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={enumInference}
                onCheckedChange={(v) => setEnumInference(v === true)}
              >
                Enum inference
              </MenubarCheckboxItem>
              {enumInference && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Enum threshold
                  </div>
                  <MenubarRadioGroup
                    value={String(enumThreshold)}
                    onValueChange={(v) => setEnumThreshold(Number(v))}
                  >
                    {THRESHOLDS.map((t) => (
                      <MenubarRadioItem key={t} value={String(t)}>
                        {t} values
                      </MenubarRadioItem>
                    ))}
                  </MenubarRadioGroup>
                </>
              )}
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="flex items-center gap-1.5">
          <FileCode className="size-3.5 text-muted-foreground" />
          <Label className="text-xs font-medium text-muted-foreground">Root</Label>
          <Input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            aria-label="Root type name"
            className="h-8 w-28 text-xs"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => copy(output)} disabled={!output || !!error}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setInput("")} disabled={!input}>
            <Eraser className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-1.5">
          <Label htmlFor="json-input" className="text-xs font-medium text-muted-foreground">
            JSON
          </Label>
          <Textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste JSON or an array of objects…\n\n[\n  { "name": "Forge" }\n]`}
            spellCheck={false}
            className={`min-h-0 flex-1 resize-none rounded-xl font-mono text-xs leading-relaxed ${
              error ? "border-destructive/60 ring-1 ring-destructive/20" : "border-input/60"
            }`}
            aria-invalid={!!error}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-1.5">
          <Label htmlFor="ts-output" className="text-xs font-medium text-muted-foreground">
            TypeScript
          </Label>
          {error ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <Badge variant="destructive">Invalid JSON</Badge>
              <p className="text-center font-mono text-xs text-destructive">{error}</p>
            </div>
          ) : (
            <Textarea
              id="ts-output"
              value={output}
              readOnly
              placeholder="Generated TypeScript will appear here…"
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-xl border-input/60 bg-muted/30 font-mono text-xs leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  )
}
