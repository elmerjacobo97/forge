export interface Snippet {
  id: string;
  title: string;
  kind: SnippetKind;
  content: string;
  language: string | null;
  tags: string[];
  createdAt: string;
}

export type SnippetKind = "note" | "prompt" | "config" | "snippet";
