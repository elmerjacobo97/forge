import { SnippetKind } from "../types";

export const KINDS: { value: SnippetKind; label: string }[] = [
  { value: "all" as SnippetKind, label: "All" },
  { value: "note", label: "Notes" },
  { value: "prompt", label: "Prompts" },
  { value: "config", label: "Configs" },
  { value: "snippet", label: "Snippets" },
] as const;
