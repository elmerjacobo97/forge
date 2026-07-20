"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopy } from "@/lib/hooks/use-copy";
import { SchemaEditor } from "./schema-editor";
import { clampCount, formatOutput, generateRecords } from "./utils/generate";
import { BUILTIN_PRESETS } from "./utils/presets";
import { loadCurrentSchema, saveCurrentSchema } from "./utils/storage";
import type { OutputFormat, Preset, Schema } from "./utils/types";

const FORMATS: { id: OutputFormat; label: string; ext: string }[] = [
  { id: "json", label: "JSON", ext: "json" },
  { id: "ndjson", label: "NDJSON", ext: "ndjson" },
  { id: "csv", label: "CSV", ext: "csv" },
];

function getDefaultSchema(): Schema {
  return BUILTIN_PRESETS[0].schema;
}

export function MockDataGenerator() {
  const presets = BUILTIN_PRESETS as Preset[];
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [schema, setSchema] = useState<Schema>(() => {
    return loadCurrentSchema() ?? getDefaultSchema();
  });
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<OutputFormat>("json");
  const [output, setOutput] = useState("");
  const { copied, copy } = useCopy();

  useEffect(() => {
    saveCurrentSchema(schema);
  }, [schema]);

  const fields = useMemo(() => schema.fields, [schema.fields]);

  function handlePresetSelect(id: string) {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setActivePresetId(id);
    setSchema({ ...preset.schema });
  }

  function handleSchemaChange(fields: typeof schema.fields) {
    setSchema({ fields });
    setActivePresetId(null);
    setOutput("");
  }

  function handleCountChange(value: string) {
    const n = Number(value);
    if (Number.isFinite(n)) setCount(clampCount(n));
  }

  const generate = useCallback(() => {
    if (schema.fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }
    const records = generateRecords(schema, count);
    const keys = Object.keys(records[0]);
    const formatted = formatOutput(records, format, keys);
    setOutput(formatted);
  }, [schema, count, format]);

  function downloadOutput() {
    if (!output) return;
    const fmt = FORMATS.find((f) => f.id === format)!;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-data.${fmt.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded", {
      description: `mock-data.${fmt.ext}`,
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={activePresetId ?? ""} onValueChange={handlePresetSelect}>
          <SelectTrigger className="h-8 w-55 text-xs" aria-label="Preset">
            <SelectValue placeholder="Select preset…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Built-in</SelectLabel>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={format}
          onValueChange={(v) => v && setFormat(v as OutputFormat)}
          variant="outline"
          size="sm"
        >
          {FORMATS.map((f) => (
            <ToggleGroupItem key={f.id} value={f.id}>
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Count
          </span>
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

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            <Plus className="size-3.5" />
            Save preset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copy(output)}
            disabled={!output}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadOutput}
                disabled={!output}
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Save as .{FORMATS.find((f) => f.id === format)?.ext}
            </TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={generate}>
            <RefreshCw className="size-3.5" />
            Generate
          </Button>
        </div>
      </div>

      <SchemaEditor fields={fields} onChange={handleSchemaChange} />

      <Textarea
        value={output}
        readOnly
        placeholder="Generated data will appear here…"
        spellCheck={false}
        className="min-h-0 flex-1 resize-none rounded-xl border-input/60 bg-muted/30 font-mono text-xs leading-relaxed"
      />
    </div>
  );
}
