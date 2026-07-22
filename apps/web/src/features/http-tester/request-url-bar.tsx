"use client";

import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HttpMethod, HttpRequestConfig } from "./utils/history";
import { METHODS, METHOD_COLORS } from "./http-tester-shared";

export interface RequestUrlBarProps {
  config: HttpRequestConfig;
  loading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
}

export function RequestUrlBar({
  config,
  loading,
  onMethodChange,
  onUrlChange,
  onSend,
}: RequestUrlBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={config.method}
        onValueChange={(v) => onMethodChange(v as HttpMethod)}
      >
        <SelectTrigger className="h-9 w-28 shrink-0 text-xs font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {METHODS.map((m) => (
            <SelectItem key={m} value={m} className="text-xs font-semibold">
              <span className={METHOD_COLORS[m]}>{m}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={config.url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) onSend();
        }}
        placeholder="https://api.example.com/endpoint"
        spellCheck={false}
        className="h-9 flex-1 font-mono text-xs"
      />
      <Button
        size="sm"
        onClick={onSend}
        disabled={loading || !config.url.trim()}
        className="h-9 shrink-0 gap-1.5"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {loading ? "Sending" : "Send"}
      </Button>
    </div>
  );
}
