import { useMemo, useState } from "react";
import { ArrowDownUp, Check, Copy, Eraser, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useCopy } from "@/lib/hooks/use-copy";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  ENTITIES,
  decodeHtml,
  encodeHtml,
  type EncodeMode,
  type EntityEntry,
} from "@/features/html-entities/utils/html-entities";

type Mode = "encode" | "decode";

export function HtmlEntities() {
  return (
    <Tabs defaultValue="reference" className="flex h-full flex-col gap-4">
      <TabsList className="self-start">
        <TabsTrigger value="reference">Reference</TabsTrigger>
        <TabsTrigger value="codec">Encode / Decode</TabsTrigger>
      </TabsList>
      <TabsContent
        value="reference"
        className="min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <EntityReference />
      </TabsContent>
      <TabsContent
        value="codec"
        className="min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <EntityCodec />
      </TabsContent>
    </Tabs>
  );
}

function EntityReference() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [copiedVal, setCopiedVal] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 150);

  const categories = useMemo(() => {
    const set = new Set(ENTITIES.map((e) => e.category));
    return ["all", ...set];
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return ENTITIES.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return (
        e.char.toLowerCase().includes(q) ||
        (e.name?.toLowerCase().includes(q) ?? false) ||
        e.description.toLowerCase().includes(q) ||
        e.decimal.toLowerCase().includes(q) ||
        e.hex.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [debouncedQuery, category]);

  function copyVal(val: string) {
    navigator.clipboard.writeText(val);
    setCopiedVal(val);
    setTimeout(() => setCopiedVal(null), 1200);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities (e.g. copyright, arrow, euro)…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(v) => v && setCategory(v)}
          size="sm"
          variant="outline"
        >
          {categories.map((cat) => (
            <ToggleGroupItem
              key={cat}
              value={cat}
              className="text-xs capitalize"
            >
              {cat}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-xl border border-input/60">
        <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry, i) => (
            <EntityCard
              key={`${entry.decimal}-${i}`}
              entry={entry}
              copiedVal={copiedVal}
              onCopy={copyVal}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No entities found.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function EntityCard({
  entry,
  copiedVal,
  onCopy,
}: {
  entry: EntityEntry;
  copiedVal: string | null;
  onCopy: (val: string) => void;
}) {
  const representations = [
    { label: "Named", value: entry.name ? `&${entry.name};` : null },
    { label: "Decimal", value: entry.decimal },
    { label: "Hex", value: entry.hex },
  ].filter((r) => r.value !== null);

  return (
    <div className="flex flex-col gap-2 bg-background p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-medium">
          {entry.char}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{entry.description}</p>
          <p className="text-[10px] text-muted-foreground">{entry.category}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {representations.map((rep) => {
          const isCopied = copiedVal === rep.value;
          return (
            <button
              key={rep.label}
              type="button"
              onClick={() => onCopy(rep.value!)}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                isCopied
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-input/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title={`Copy ${rep.label}: ${rep.value}`}
            >
              {isCopied ? (
                <Check className="size-2.5" />
              ) : (
                <Copy className="size-2.5" />
              )}
              {rep.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EntityCodec() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeMode, setEncodeMode] = useState<EncodeMode>("named");
  const { copied, copy } = useCopy();

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null };
    if (mode === "encode") {
      return { output: encodeHtml(input, encodeMode), error: null };
    }
    return decodeHtml(input);
  }, [input, mode, encodeMode]);

  function handleCopy() {
    if (!output) return;
    copy(output);
  }

  function handleSwap() {
    if (!output) return;
    setInput(output);
    setMode(mode === "encode" ? "decode" : "encode");
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

        {mode === "encode" && (
          <ToggleGroup
            type="single"
            value={encodeMode}
            onValueChange={(v) => v && setEncodeMode(v as EncodeMode)}
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem value="named">Named</ToggleGroupItem>
            <ToggleGroupItem value="decimal">Decimal</ToggleGroupItem>
            <ToggleGroupItem value="hex">Hex</ToggleGroupItem>
          </ToggleGroup>
        )}

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
          <Badge
            variant="secondary"
            className="border-primary/30 text-primary/80"
          >
            {mode === "encode" ? "Text \u2192 HTML" : "HTML \u2192 Text"}
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={!output || !!error}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy output</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setInput("")}
                disabled={!input}
              >
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
            <Label
              htmlFor="html-input"
              className="text-xs font-medium text-muted-foreground"
            >
              {mode === "encode" ? "Text" : "HTML Entities"}
            </Label>
            <Textarea
              id="html-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "Enter text to encode\u2026\n\ne.g. Tom & Jerry \u00A9 2024"
                  : "Enter HTML entities to decode\u2026\n\ne.g. Tom &amp; Jerry &copy; 2024"
              }
              spellCheck={false}
              className={`min-h-0 flex-1 resize-none rounded-xl font-mono text-xs leading-relaxed ${
                error
                  ? "border-destructive/60 ring-1 ring-destructive/20"
                  : "border-input/60"
              }`}
              aria-invalid={!!error}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={50} minSize={20} className="p-2">
          <div className="flex h-full flex-col gap-1.5">
            <Label
              htmlFor="html-output"
              className="text-xs font-medium text-muted-foreground"
            >
              {mode === "encode" ? "HTML Entities" : "Text"}
            </Label>
            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <Badge variant="destructive">Decode Error</Badge>
                <p className="text-center font-mono text-xs text-destructive">
                  {error}
                </p>
              </div>
            ) : (
              <Textarea
                id="html-output"
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
  );
}
