import { useMemo, useState } from "react"
import { Check, Copy, Eraser, Regex, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"
import { cn } from "@/lib/utils"

interface FlagDef {
  key: string
  label: string
  desc: string
}

const FLAGS: FlagDef[] = [
  { key: "g", label: "g", desc: "Global — find all matches" },
  { key: "i", label: "i", desc: "Case-insensitive" },
  { key: "m", label: "m", desc: "Multiline — ^ and $ match line endings" },
  { key: "s", label: "s", desc: "Dotall — . matches newlines" },
  { key: "u", label: "u", desc: "Unicode" },
  { key: "y", label: "y", desc: "Sticky — match at lastIndex only" },
]

interface Match {
  text: string
  index: number
  groups: string[]
}

type Segment = string | { text: string; match: boolean }

export function RegexTester() {
  const [pattern, setPattern] = useState("")
  const [flags, setFlags] = useState<Record<string, boolean>>({ g: true, i: false })
  const [test, setTest] = useState("")
  const { copied, copy } = useCopy()

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null }
    try {
      const flagStr = FLAGS.reduce((acc, f) => (flags[f.key] ? acc + f.key : acc), "")
      return { regex: new RegExp(pattern, flagStr), error: null }
    } catch (e) {
      return { regex: null, error: (e as Error).message }
    }
  }, [pattern, flags])

  const { matches, highlighted } = useMemo<{ matches: Match[]; highlighted: Segment[] }>(() => {
    if (!regex || !test) return { matches: [], highlighted: [] }
    const result: Match[] = []
    const globalRegex = regex.global ? regex : new RegExp(regex.source, regex.flags + "g")
    const segments: Segment[] = []
    let m: RegExpExecArray | null
    let lastIndex = 0

    while ((m = globalRegex.exec(test)) !== null) {
      if (m.index > lastIndex) {
        segments.push(test.slice(lastIndex, m.index))
      }
      segments.push({ text: m[0], match: true })
      result.push({
        text: m[0],
        index: m.index,
        groups: m.slice(1).map((g) => g ?? ""),
      })
      lastIndex = m.index + m[0].length
      if (m[0].length === 0) globalRegex.lastIndex++
    }
    if (lastIndex < test.length) {
      segments.push(test.slice(lastIndex))
    }
    return { matches: result, highlighted: segments }
  }, [regex, test])

  function copyMatches() {
    if (!matches.length) return
    copy(matches.map((m) => m.text).join("\n"))
  }

  function clearAll() {
    setPattern("")
    setTest("")
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm text-muted-foreground">/</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="\\b\\w+@\\w+\\.\\w+"
            className="h-8 w-64 font-mono text-xs"
          />
          <span className="font-mono text-sm text-muted-foreground">/</span>
        </div>

        <div className="flex items-center gap-1">
          {FLAGS.map((f) => (
            <Tooltip key={f.key}>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  variant="outline"
                  pressed={flags[f.key] ?? false}
                  onPressedChange={(v) => setFlags((prev) => ({ ...prev, [f.key]: v }))}
                  className={cn(
                    "h-7 min-w-7 px-2 font-mono text-xs",
                    flags[f.key] && "border-primary text-primary"
                  )}
                  aria-label={f.desc}
                >
                  {f.label}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>{f.desc}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {regex && (
          <Badge variant="secondary" className="border-primary/30 text-primary/80">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={copyMatches} disabled={!matches.length}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy matches"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy all matches to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={clearAll}
                disabled={!pattern && !test}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="size-4 text-destructive" />
          <span className="font-mono text-xs text-destructive">{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Test string</Label>
        <Textarea
          value={test}
          onChange={(e) => setTest(e.target.value)}
          placeholder="Enter text to test against your pattern…"
          spellCheck={false}
          className="min-h-24 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2 rounded-xl border bg-muted/20">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Regex className="size-3.5" />
              Highlighted
            </span>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <pre className="whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed">
              {highlighted.length === 0 ? (
                <span className="text-muted-foreground">Matches will appear highlighted here…</span>
              ) : (
                highlighted.map((seg, i) =>
                  typeof seg === "string" ? (
                    <span key={i}>{seg}</span>
                  ) : (
                    <mark key={i} className="rounded-sm bg-primary/25 px-0.5 text-foreground">
                      {seg.text}
                    </mark>
                  )
                )
              )}
            </pre>
          </ScrollArea>
        </div>

        <div className="flex min-h-0 flex-col gap-2 rounded-xl border bg-muted/20">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Matches
            </span>
            {matches.length > 0 && (
              <Badge variant="ghost" className="text-[10px] text-muted-foreground">
                {matches.length}
              </Badge>
            )}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <ul className="flex flex-col">
              {matches.length === 0 ? (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No matches yet.
                </li>
              ) : (
                matches.map((m, i) => (
                  <li
                    key={m.index}
                    className="group flex flex-col gap-1 border-b border-border/40 px-3 py-2 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="h-4 px-1.5 text-[10px] text-muted-foreground"
                      >
                        #{i + 1}
                      </Badge>
                      <code className="truncate font-mono text-xs font-medium text-foreground">
                        {m.text || "(empty match)"}
                      </code>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        @{m.index}
                      </span>
                    </div>
                    {m.groups.length > 0 && m.groups.some((g) => g) && (
                      <div className="flex flex-wrap gap-1 pl-6">
                        {m.groups.map((g, gi) =>
                          g ? (
                            <Badge
                              key={gi}
                              variant="secondary"
                              className="h-4 px-1.5 text-[10px]"
                            >
                              <span className="text-muted-foreground">${gi + 1}:</span> {g}
                            </Badge>
                          ) : null
                        )}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
