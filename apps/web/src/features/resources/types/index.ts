export interface Resource {
  id: string;
  title: string;
  kind: ResourceKind;
  content: string;
  language: string | null;
  tags: string[];
  tool: ResourceTool | null;
  customTool: string | null;
  version: string | null;
  context: string | null;
  createdAt: string;
}

export type ResourceKind = "note" | "prompt" | "config" | "code";

export type ResourceTool =
  "react-native" | "vscode" | "cursor" | "opencode" | "claude-code" | "other";

export type ResourceFormat =
  "json" | "yaml" | "javascript" | "typescript" | "markdown" | "env" | "plain-text" | "other";
