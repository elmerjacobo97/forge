import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SourceImage } from "@/features/image-tools/utils/format";

export function useImageSource() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleFileSelected = useCallback((next: File | null) => {
    if (!next) return;
    loadFromFile(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (source) URL.revokeObjectURL(source.url);
    setSource(null);
    setError(null);
  }, [source]);

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
