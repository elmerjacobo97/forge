"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Check, Copy, Eraser, File, Loader2, Upload, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"

import { type Algo, ALGOS, digestBuffer } from "../hash-generator/utils/hash"

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

type FileSource = { file: File }

type HashState = {
  hash: string
  loading: boolean
  error: string | null
}

type HashAction =
  | { type: "reset" }
  | { type: "start" }
  | { type: "success"; hash: string }
  | { type: "failure"; error: string }
  | { type: "set-error"; error: string | null }

const initialHashState: HashState = {
  hash: "",
  loading: false,
  error: null,
}

function hashReducer(state: HashState, action: HashAction): HashState {
  switch (action.type) {
    case "reset":
      return initialHashState
    case "start":
      return { hash: "", loading: true, error: null }
    case "success":
      return { hash: action.hash, loading: false, error: null }
    case "failure":
      return { hash: "", loading: false, error: action.error }
    case "set-error":
      return { ...state, error: action.error }
  }
}

function hasErrorMessage(error: unknown): error is { message: unknown } {
  if (
    !((typeof error === "object" && error !== null) || typeof error === "function")
  ) {
    return false
  }

  return "message" in error
}

function getErrorMessage(error: unknown): string {
  if (hasErrorMessage(error) && error.message) return String(error.message)
  return String(error)
}

export function FileValidator() {
  const [source, setSource] = useState<FileSource | null>(null)
  const [algo, setAlgo] = useState<Algo>("sha-256")
  const [{ hash, loading, error }, dispatchHash] = useReducer(hashReducer, initialHashState)
  const [expected, setExpected] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const { copied, copy } = useCopy()
  const requestIdRef = useRef(0)

  const currentAlgo = useMemo(() => ALGOS.find((a) => a.id === algo)!, [algo])

  useEffect(() => {
    const target = source
    if (!target) {
      dispatchHash({ type: "reset" })
      return
    }

    const id = ++requestIdRef.current
    dispatchHash({ type: "start" })

    async function run() {
      if (!target) return
      try {
        const buffer = await target.file.arrayBuffer()
        if (requestIdRef.current !== id) return
        const result = await digestBuffer(algo, buffer)
        if (requestIdRef.current !== id) return
        dispatchHash({ type: "success", hash: result })
      } catch (e) {
        if (requestIdRef.current !== id) return
        const message = getErrorMessage(e)
        dispatchHash({ type: "failure", error: message.replace(/^Error:\s*/, "") })
      }
    }

    run()

    return () => {
      // Invalidate in-flight work for this effect instance only
      if (requestIdRef.current === id) {
        requestIdRef.current = id + 1
      }
    }
  }, [source, algo])

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    document.addEventListener("dragenter", preventDefault)
    document.addEventListener("dragover", preventDefault)
    document.addEventListener("drop", preventDefault)

    return () => {
      document.removeEventListener("dragenter", preventDefault)
      document.removeEventListener("dragover", preventDefault)
      document.removeEventListener("drop", preventDefault)
    }
  }, [])

  const comparison = useMemo(() => {
    if (!hash || !expected.trim()) return null
    const a = hash.replace(/\s+/g, "").toLowerCase()
    const b = expected.replace(/\s+/g, "").toLowerCase()
    return a === b ? "match" : "mismatch"
  }, [hash, expected])

  function handleFileSelected(next: File | null) {
    if (!next) return
    if (next.size === 0) {
      dispatchHash({ type: "set-error", error: "Empty file" })
      setSource(null)
      return
    }
    setSource({ file: next })
    dispatchHash({ type: "set-error", error: null })
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (dropped.type === "" && dropped.size === 0) {
      dispatchHash({ type: "set-error", error: "Folders are not supported" })
      return
    }
    handleFileSelected(dropped)
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    e.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setDragOver(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelected(e.target.files?.[0] ?? null)
    e.target.value = ""
  }

  const clear = useCallback(() => {
    requestIdRef.current++
    setSource(null)
    setExpected("")
    dispatchHash({ type: "reset" })
  }, [])

  const displayPath = source?.file.name
  const displaySize = source?.file.size

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={algo}
          onValueChange={(v) => v && setAlgo(v as Algo)}
          variant="outline"
          size="sm"
        >
          {ALGOS.map((a) => (
            <ToggleGroupItem key={a.id} value={a.id}>
              {a.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Badge variant="secondary" className="border-primary/30 text-primary/80">
          {currentAlgo.bits} bits
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          {hash && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => copy(hash)}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy hash"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy computed hash</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" onClick={clear} disabled={!displayPath}>
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-input/60 bg-muted/20 hover:border-input hover:bg-muted/30",
        ].join(" ")}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Upload className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {dragOver ? "Drop file here" : "Drag & drop a file here"}
          </p>
          <p className="text-xs text-muted-foreground">or</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-label="Select file"
          onChange={handleInputChange}
        />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Select file
        </Button>
      </div>

      {displayPath && (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2">
          <File className="size-4 text-muted-foreground" />
          <span className="flex-1 truncate text-sm font-medium">{displayPath}</span>
          {displaySize !== undefined && (
            <Badge variant="ghost" className="text-xs text-muted-foreground">
              {formatSize(displaySize)}
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Expected hash</Label>
        <div className="flex items-center gap-2">
          <Input
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder={`Paste expected ${currentAlgo.label} hash…`}
            spellCheck={false}
            className="rounded-xl border-input/60 font-mono text-xs"
          />
          {comparison === "match" && (
            <Badge className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-600">
              <Check className="mr-1 size-3" />
              Match
            </Badge>
          )}
          {comparison === "mismatch" && (
            <Badge variant="destructive" className="shrink-0">
              <X className="mr-1 size-3" />
              Mismatch
            </Badge>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Computed hash</Label>
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-muted/20">
          {hash ? (
            <div className="flex min-h-0 flex-1 items-start gap-3 p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-muted-foreground">
                {hash}
              </code>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => copy(hash)}
                    aria-label="Copy computed hash"
                  >
                    {copied ? (
                      <Check className="size-3 text-primary" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            </div>
          ) : loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <p className="text-xs">Computing {currentAlgo.label}…</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-destructive">
              <X className="size-5" />
              <p className="text-xs">{error}</p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-muted-foreground">
                Select or drop a file to compute its hash
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
