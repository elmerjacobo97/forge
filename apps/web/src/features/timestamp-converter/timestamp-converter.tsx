"use client";

import { useEffect, useMemo, useState } from "react"
import { ArrowLeftRight, Check, Copy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"

import { formatRelative, safeFormat } from "./utils/time"

type Mode = "ts-to-date" | "date-to-ts"
type Unit = "s" | "ms"

interface ResultRow {
  label: string
  value: string
  copyKey: string
}

export function TimestampConverter() {
  const [mode, setMode] = useState<Mode>("ts-to-date")
  const [unit, setUnit] = useState<Unit>("s")
  const [tsInput, setTsInput] = useState("")
  const [dateInput, setDateInput] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { copy } = useCopy()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const tsResult = useMemo(() => {
    if (!tsInput.trim()) return null
    const raw = Number(tsInput.trim())
    if (!Number.isFinite(raw)) return { error: "Not a valid number" }
    const ms = unit === "s" ? raw * 1000 : raw
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return { error: "Invalid timestamp" }
    return { date }
  }, [tsInput, unit])

  const dateResult = useMemo(() => {
    if (!dateInput.trim()) return null
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return { error: "Invalid date string" }
    return { date }
  }, [dateInput])

  function handleCopy(value: string, key: string) {
    copy(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  function handleNow() {
    if (mode === "ts-to-date") {
      setTsInput(String(Math.floor(now / (unit === "s" ? 1000 : 1))))
    } else {
      setDateInput(new Date(now).toISOString())
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="ts-to-date">TS → Date</TabsTrigger>
            <TabsTrigger value="date-to-ts">Date → TS</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "ts-to-date" && (
          <ToggleGroup
            type="single"
            value={unit}
            onValueChange={(v) => v && setUnit(v as Unit)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="s">sec</ToggleGroupItem>
            <ToggleGroupItem value="ms">ms</ToggleGroupItem>
          </ToggleGroup>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={handleNow}>
              <ArrowLeftRight className="size-3.5" />
              Now
            </Button>
          </TooltipTrigger>
          <TooltipContent>Use current timestamp</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {Math.floor(now / 1000)}
          </Badge>
        </div>
      </div>

      {mode === "ts-to-date" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Timestamp ({unit})
            </Label>
            <Input
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="1697000000"
              className="font-mono text-sm"
            />
          </div>

          {tsResult?.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <Badge variant="destructive">Error</Badge>
              <p className="font-mono text-xs text-destructive">{tsResult.error}</p>
            </div>
          )}

          {tsResult?.date && (
            <ResultGrid date={tsResult.date} unit={unit} onCopy={handleCopy} copiedKey={copiedKey} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Date string</Label>
            <Textarea
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="2024-10-10T12:00:00Z"
              className="min-h-20 resize-none font-mono text-xs"
            />
          </div>

          {dateResult?.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <Badge variant="destructive">Error</Badge>
              <p className="font-mono text-xs text-destructive">{dateResult.error}</p>
            </div>
          )}

          {dateResult?.date && (
            <ResultGrid date={dateResult.date} unit={unit} onCopy={handleCopy} copiedKey={copiedKey} />
          )}
        </div>
      )}
    </div>
  )
}

function ResultGrid({
  date,
  unit,
  onCopy,
  copiedKey,
}: {
  date: Date
  unit: Unit
  onCopy: (value: string, key: string) => void
  copiedKey: string | null
}) {
  const rows: ResultRow[] = [
    { label: "ISO 8601", value: date.toISOString(), copyKey: "iso" },
    { label: "UTC", value: date.toUTCString(), copyKey: "utc" },
    { label: "Local", value: date.toLocaleString(), copyKey: "local" },
    {
      label: `Timestamp (${unit})`,
      value: String(unit === "s" ? Math.floor(date.getTime() / 1000) : date.getTime()),
      copyKey: "ts",
    },
    { label: "Relative", value: formatRelative(date), copyKey: "rel" },
    {
      label: "Date only",
      value: safeFormat(date, { year: "numeric", month: "short", day: "numeric" }),
      copyKey: "date",
    },
    {
      label: "Time only",
      value: safeFormat(date, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      copyKey: "time",
    },
  ]

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-muted/20 p-3">
      {rows.map((row) => (
        <div
          key={row.copyKey}
          className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50"
        >
          <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
            {row.label}
          </span>
          <code className="flex-1 truncate font-mono text-xs">{row.value}</code>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onCopy(row.value, row.copyKey)}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={`Copy ${row.label}`}
          >
            {copiedKey === row.copyKey ? (
              <Check className="size-3 text-primary" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
