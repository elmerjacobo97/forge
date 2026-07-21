export interface Snippet {
  id: string;
  title: string;
  kind: SnippetKind;
  content: string;
  language: string | null;
  tags: string[];
  tool: SnippetTool | null;
  customTool: string | null;
  version: string | null;
  context: string | null;
  createdAt: string;
}

export type SnippetKind = "note" | "prompt" | "config" | "snippet";

export type SnippetTool =
  "react-native" | "vscode" | "cursor" | "opencode" | "claude-code" | "other";

export type SnippetFormat =
  "json" | "yaml" | "javascript" | "typescript" | "markdown" | "env" | "plain-text" | "other";
