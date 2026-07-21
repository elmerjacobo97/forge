import type { ResourceFormat, ResourceKind, ResourceTool } from "../types";

export const KINDS: { value: ResourceKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "note", label: "Notes" },
  { value: "prompt", label: "Prompts" },
  { value: "config", label: "Configs" },
  { value: "code", label: "Code" },
] as const;

export const TOOLS: { value: ResourceTool; label: string }[] = [
  { value: "react-native", label: "React Native" },
  { value: "vscode", label: "VS Code" },
  { value: "cursor", label: "Cursor" },
  { value: "opencode", label: "OpenCode" },
  { value: "claude-code", label: "Claude Code" },
  { value: "other", label: "Other" },
] as const;

export const FORMATS: { value: ResourceFormat; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "markdown", label: "Markdown" },
  { value: "env", label: "ENV" },
  { value: "plain-text", label: "Plain text" },
  { value: "other", label: "Other" },
] as const;
