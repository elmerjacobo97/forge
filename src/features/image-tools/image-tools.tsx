import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Download,
  Eraser,
  File as FileIcon,
  Image as ImageIcon,
  Link2,
  Link2Off,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type OutputFormat = "png" | "jpeg" | "webp";

const FORMATS: { id: OutputFormat; label: string; mime: string }[] = [
  { id: "png", label: "PNG", mime: "image/png" },
  { id: "jpeg", label: "JPG", mime: "image/jpeg" },
  { id: "webp", label: "WebP", mime: "image/webp" },
];

const LOSSY: OutputFormat[] = ["jpeg", "webp"];

interface DragDropPayload {
  paths: string[];
  position: { x: number; y: number };
}

interface SourceImage {
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;
}

interface OutputResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
  format: OutputFormat;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function pctOf(a: number, b: number): string {
  if (a === 0 || b === 0) return "";
  const p = ((b - a) / a) * 100;
  if (p >= 0) return `+${p.toFixed(0)}%`;
  return `${p.toFixed(0)}%`;
}

export function ImageTools() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [output, setOutput] = useState<OutputResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isLossy = LOSSY.includes(format);
  const currentMime = useMemo(
    () => FORMATS.find((f) => f.id === format)!.mime,
    [format],
  );

  // Sync target size when a new image is loaded.
  useEffect(() => {
    if (source) {
      setTargetWidth(source.width);
      setTargetHeight(source.height);
    }
  }, [source]);

  // Revoke object URLs on cleanup.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
      if (output) URL.revokeObjectURL(output.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native drag-drop (Tauri runtime).
  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | null = null;

    async function setup() {
      try {
        unlisten = await listen<DragDropPayload>(
          "tauri://drag-drop",
          (event) => {
            if (!mounted) return;
            const path = event.payload.paths[0];
            if (!path) return;
            setDragOver(false);
            void loadNative(path);
          },
        );
      } catch {
        // Web-only dev mode: native drag-drop unavailable.
      }
    }

    setup();

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent browser from navigating on drop.
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("dragenter", preventDefault);
    document.addEventListener("dragover", preventDefault);
    document.addEventListener("drop", preventDefault);
    return () => {
      document.removeEventListener("dragenter", preventDefault);
      document.removeEventListener("dragover", preventDefault);
      document.removeEventListener("drop", preventDefault);
    };
  }, []);

  function resetOutput() {
    if (output) URL.revokeObjectURL(output.url);
    setOutput(null);
  }

  function loadFromFile(file: File) {
    if (file.size === 0) {
      setError("Empty file");
      toast.error("Empty file");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.onload = () => {
      if (source) URL.revokeObjectURL(source.url);
      resetOutput();
      setError(null);
      setSource({
        name: file.name,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type || "image/*",
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Failed to decode image");
      toast.error("Failed to decode image", {
        description: "Not a valid image or unsupported format",
      });
    };
    img.src = url;
  }

  async function loadNative(path: string) {
    try {
      const bytes = await invoke<number[]>("read_file_bytes", { path });
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "image/*",
      });
      const file = new File([blob], path.split(/[/\\]/).pop() ?? "image");
      loadFromFile(file);
    } catch (e) {
      setError((e as Error).message || String(e));
    }
  }

  function handleFileSelected(next: File | null) {
    if (!next) return;
    loadFromFile(next);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelected(e.target.files?.[0] ?? null);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    handleFileSelected(dropped);
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOver(false);
    }
  }

  function applyResize(value: number, axis: "w" | "h") {
    if (!source) return;
    if (axis === "w") setTargetWidth(value);
    else setTargetHeight(value);
    if (lockAspect && source.width && source.height) {
      const ratio = source.width / source.height;
      if (axis === "w") setTargetHeight(Math.round(value / ratio));
      else setTargetWidth(Math.round(value * ratio));
    }
  }

  const convert = useCallback(async () => {
    if (!source) return;
    setLoading(true);
    setError(null);
    resetOutput();
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = document.createElement("img");
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Failed to load source image"));
        el.src = source.url;
      });

      const w = resizeEnabled
        ? Math.max(1, targetWidth || source.width)
        : source.width;
      const h = resizeEnabled
        ? Math.max(1, targetHeight || source.height)
        : source.height;

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      // White background for transparent -> JPG (no alpha channel).
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(
          resolve,
          currentMime,
          isLossy ? quality / 100 : undefined,
        ),
      );
      if (!blob) throw new Error("Failed to encode image");
      const url = URL.createObjectURL(blob);
      setOutput({
        blob,
        url,
        width: w,
        height: h,
        size: blob.size,
        format,
      });
      toast.success("Image converted", {
        description: `${formatSize(blob.size)} (${pctOf(source.size, blob.size)})`,
      });
    } catch (e) {
      setError((e as Error).message || String(e));
      toast.error("Conversion failed", {
        description: (e as Error).message || String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [
    source,
    format,
    quality,
    resizeEnabled,
    targetWidth,
    targetHeight,
    currentMime,
    isLossy,
  ]);

  function downloadOutput() {
    if (!output) return;
    const a = document.createElement("a");
    a.href = output.url;
    const base = source?.name.replace(/\.[^.]+$/, "") ?? "image";
    const ext = output.format === "jpeg" ? "jpg" : output.format;
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Image downloaded", {
      description: `${base}.${ext}`,
    });
  }

  const clear = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url);
    if (output) URL.revokeObjectURL(output.url);
    setSource(null);
    setOutput(null);
    setError(null);
    setLoading(false);
    setResizeEnabled(false);
    setQuality(80);
  }, [source, output]);

  const sizeDelta = useMemo(() => {
    if (!source || !output) return null;
    return pctOf(source.size, output.size);
  }, [source, output]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top control row */}
      <div className="flex flex-wrap items-center gap-3">
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

        {isLossy && (
          <Badge variant="ghost" className="text-xs text-muted-foreground">
            Quality {quality}%
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={convert} disabled={!source || loading}>
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="size-3.5" />
                )}
                Convert
              </Button>
            </TooltipTrigger>
            <TooltipContent>Encode to {format.toUpperCase()}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={clear}
                disabled={!source}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Quality slider (lossy only) */}
      {isLossy && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Quality
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {quality}%
            </span>
          </div>
          <Slider
            value={[quality]}
            onValueChange={(v) => setQuality(v[0])}
            min={10}
            max={100}
            step={5}
            className="py-1"
          />
        </div>
      )}

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-input/60 bg-muted/20 hover:border-input hover:bg-muted/30",
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Upload className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {dragOver ? "Drop image here" : "Drag & drop an image here"}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF…</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Select image"
          onChange={handleInputChange}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Select image
        </Button>
      </div>

      {/* Source info + resize controls */}
      {source && (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm font-medium">
              {source.name}
            </span>
            <Badge variant="ghost" className="text-xs text-muted-foreground">
              {source.width}×{source.height}
            </Badge>
            <Badge variant="ghost" className="text-xs text-muted-foreground">
              {formatSize(source.size)}
            </Badge>
          </div>

          {/* Resize row */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                Resize
              </Label>
              <label className="flex h-8 items-center gap-2 text-xs font-medium text-muted-foreground">
                <Checkbox
                  checked={resizeEnabled}
                  onCheckedChange={(v) => setResizeEnabled(v === true)}
                />
                Enable
              </label>
            </div>
            <div
              className={cn(
                "flex items-end gap-2",
                !resizeEnabled && "opacity-50 pointer-events-none",
              )}
            >
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Width
                </Label>
                <Input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => applyResize(Number(e.target.value), "w")}
                  min={1}
                  className="h-8 w-24 rounded-lg font-mono text-xs"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setLockAspect((v) => !v)}
                    aria-label={lockAspect ? "Unlock aspect" : "Lock aspect"}
                    data-state={lockAspect ? "on" : "off"}
                  >
                    {lockAspect ? (
                      <Link2 className="size-3.5" />
                    ) : (
                      <Link2Off className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {lockAspect ? "Aspect locked" : "Aspect unlocked"}
                </TooltipContent>
              </Tooltip>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Height
                </Label>
                <Input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => applyResize(Number(e.target.value), "h")}
                  min={1}
                  className="h-8 w-24 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
          <X className="size-4 shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Result */}
      <canvas ref={canvasRef} className="hidden" />
      {output && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Result
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="ghost" className="text-xs text-muted-foreground">
                {output.width}×{output.height}
              </Badge>
              <Badge variant="ghost" className="text-xs text-muted-foreground">
                {formatSize(output.size)}
              </Badge>
              {sizeDelta && (
                <Badge
                  variant="ghost"
                  className={cn(
                    "text-xs",
                    sizeDelta.startsWith("+")
                      ? "text-amber-600 dark:text-amber-500"
                      : "text-emerald-600 dark:text-emerald-500",
                  )}
                >
                  {sizeDelta}
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={downloadOutput}>
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Save as .{output.format === "jpeg" ? "jpg" : output.format}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border bg-muted/20 p-3">
            <img
              src={output.url}
              alt="Converted preview"
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
