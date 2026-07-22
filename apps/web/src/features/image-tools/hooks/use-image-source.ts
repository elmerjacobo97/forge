import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SourceImage } from "@/features/image-tools/utils/format";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function useImageSource() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (!pendingFile) return;

    let cancelled = false;

    void (async () => {
      try {
        const url = await readFileAsDataUrl(pendingFile);
        if (cancelled) return;

        const img = document.createElement("img");
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to decode image"));
          img.src = url;
        });
        if (cancelled) return;

        setError(null);
        setSource({
          name: pendingFile.name,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: pendingFile.size,
          type: pendingFile.type || "image/*",
        });
      } catch {
        if (cancelled) return;
        setError("Failed to decode image");
        toast.error("Failed to decode image", {
          description: "Not a valid image or unsupported format",
        });
      } finally {
        if (!cancelled) setPendingFile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingFile]);

  function loadFromFile(file: File) {
    if (file.size === 0) {
      setError("Empty file");
      toast.error("Empty file");
      return;
    }
    setPendingFile(file);
  }

  const handleFileSelected = useCallback((next: File | null) => {
    if (!next) return;
    loadFromFile(next);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelected(e.target.files?.[0] ?? null);
      e.target.value = "";
    },
    [handleFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (!dropped) return;
      handleFileSelected(dropped);
    },
    [handleFileSelected],
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOver(false);
    }
  }, []);

  const clearSource = useCallback(() => {
    setSource(null);
    setPendingFile(null);
    setError(null);
  }, []);

  // Prevent browser from navigating on drop
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

  return {
    source,
    error,
    dragOver,
    inputRef,
    setSource,
    setError,
    setDragOver,
    loadFromFile,
    handleFileSelected,
    handleInputChange,
    handleDrop,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    clearSource,
  };
}
