import { useMemo, useState } from "react"
import { Check, Copy, Eraser, KeyRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"

import {
  type DecodedJwt,
  KNOWN_CLAIMS,
  decodeJwt,
  formatTimestampClaim,
} from "./utils/jwt"

interface ClaimRow {
  key: string
  label: string
  value: string
  hint?: string
  isKnown: boolean
}

function formatValue(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return String(value)
  return JSON.stringify(value, null, 2)
}

function buildRows(record: Record<string, unknown>): ClaimRow[] {
  return Object.entries(record).map(([key, value]) => {
    const isKnown = key in KNOWN_CLAIMS
    const tsHint = formatTimestampClaim(value)
    return {
      key,
      label: isKnown ? KNOWN_CLAIMS[key] : key,
      value: formatValue(value),
      hint: tsHint ? new Date(tsHint).toUTCString() : undefined,
      isKnown,
    }
  })
}

export function JwtDecoder() {
  const [token, setToken] = useState("")
  const { copied, copy } = useCopy()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const decoded: DecodedJwt | null = useMemo(() => decodeJwt(token), [token])

  const headerRows = useMemo(
    () => (decoded ? buildRows(decoded.header) : []),
    [decoded]
  )

  const payloadRows = useMemo(
    () => (decoded ? buildRows(decoded.payload) : []),
    [decoded]
  )

  const isExpired = useMemo(() => {
    if (!decoded?.payload.exp) return null
    const exp = decoded.payload.exp
    if (typeof exp !== "number") return null
    return Date.now() >= exp * 1000
  }, [decoded])

  function handleCopy(value: string, key: string) {
    copy(value)
    setCopiedKey(key)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {decoded && (
          <Badge variant="secondary" className="border-primary/30 text-primary/80">
            <KeyRound className="size-3" />
            {decoded.header.alg ?? "unknown"}
          </Badge>
        )}
        {decoded?.header.typ && (
          <Badge variant="outline">{decoded.header.typ}</Badge>
        )}
        {isExpired !== null && (
          <Badge variant={isExpired ? "destructive" : "secondary"}>
            {isExpired ? "Expired" : "Active"}
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setToken("")}
                disabled={!token}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">JWT Token</Label>
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          spellCheck={false}
          className="min-h-24 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
        />
      </div>

      {token.trim() && !decoded && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <Badge variant="destructive">Error</Badge>
          <Badge variant="ghost" className="font-mono text-xs text-destructive">
            Invalid JWT format
          </Badge>
        </div>
      )}

      {decoded && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <ClaimSection title="Header" rows={headerRows} copied={copied} copiedKey={copiedKey} onCopy={handleCopy} />
          <ClaimSection title="Payload" rows={payloadRows} copied={copied} copiedKey={copiedKey} onCopy={handleCopy} />
        </div>
      )}
    </div>
  )
}

function ClaimSection({
  title,
  rows,
  copied,
  copiedKey,
  onCopy,
}: {
  title: string
  rows: ClaimRow[]
  copied: boolean
  copiedKey: string | null
  onCopy: (value: string, key: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-xl border bg-muted/20">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </Label>
        <Badge variant="ghost" className="text-[10px] text-muted-foreground">
          {rows.length}
        </Badge>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li
              key={row.key}
              className="group flex flex-col gap-0.5 border-b border-border/40 px-3 py-2 last:border-0"
            >
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs font-medium text-foreground">{row.key}</code>
                {row.isKnown && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-muted-foreground">
                    {row.label}
                  </Badge>
                )}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onCopy(row.value, row.key)}
                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Copy ${row.key}`}
                >
                  {copied && copiedKey === row.key ? (
                    <Check className="size-3 text-primary" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>
              <code className="break-all font-mono text-xs text-muted-foreground">
                {row.value}
              </code>
              {row.hint && (
                <span className="font-mono text-[10px] text-primary/70">
                  {row.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
