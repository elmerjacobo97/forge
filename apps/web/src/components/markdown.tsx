import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ node: _node, ...props }) => (
    <h1
      className="mt-2 mb-1 text-xs font-semibold first:mt-0"
      {...props}
    />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2
      className="mt-2 mb-1 text-xs font-semibold first:mt-0"
      {...props}
    />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3
      className="mt-2 mb-1 text-[11px] font-semibold first:mt-0"
      {...props}
    />
  ),
  h4: ({ node: _node, ...props }) => (
    <h4
      className="mt-2 mb-1 text-[11px] font-semibold first:mt-0"
      {...props}
    />
  ),
  p: ({ node: _node, ...props }) => (
    <p
      className="my-1 first:mt-0 last:mb-0"
      {...props}
    />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul
      className="my-1 list-disc space-y-0.5 pl-4"
      {...props}
    />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol
      className="my-1 list-decimal space-y-0.5 pl-4"
      {...props}
    />
  ),
  li: ({ node: _node, ...props }) => (
    <li
      className="pl-0.5"
      {...props}
    />
  ),
  code: ({ node: _node, className, ...props }) => {
    const isBlock = typeof className === "string" && className.startsWith("language-");
    return (
      <code
        className={cn("font-mono text-[10px]", !isBlock && " bg-muted px-1 py-0.5", className)}
        {...props}
      />
    );
  },
  pre: ({ node: _node, ...props }) => (
    <pre
      className="my-1 overflow-x-auto bg-muted/60 p-2 font-mono text-[10px]"
      {...props}
    />
  ),
  a: ({ node: _node, ...props }) => (
    <a
      className="underline underline-offset-2 hover:text-foreground"
      {...props}
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="my-1 border-l-2 border-border pl-2 text-muted-foreground"
      {...props}
    />
  ),
  hr: ({ node: _node, ...props }) => (
    <hr
      className="my-2 border-border"
      {...props}
    />
  ),
  table: ({ node: _node, ...props }) => (
    <table
      className="my-1 w-full border-collapse text-[10px]"
      {...props}
    />
  ),
  th: ({ node: _node, ...props }) => (
    <th
      className="border border-border px-1 py-0.5 text-left font-medium"
      {...props}
    />
  ),
  td: ({ node: _node, ...props }) => (
    <td
      className="border border-border px-1 py-0.5"
      {...props}
    />
  ),
  input: ({ node: _node, ...props }) => (
    <input
      className="mr-1 align-middle accent-primary"
      {...props}
    />
  ),
};

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("text-[11px] leading-relaxed break-words whitespace-pre-line", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
