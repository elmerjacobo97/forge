import {
  LucideIcon,
  Braces,
  Binary,
  KeyRound,
  Regex,
  FileCode,
  Globe,
  Bookmark,
  NotebookText,
  ImageIcon,
  Columns3,
  Dices,
  Webhook,
  Activity,
} from "lucide-react";

export interface ToolDef {
  id: string;
  path: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
}

// Sidebar groups by first category appearance; keep high-value tools first.
export const tools: ToolDef[] = [
  {
    id: "dev-board",
    path: "/dev-board",
    name: "Dev Board",
    description: "Kanban board with auto time tracking for dev tasks",
    icon: Columns3,
    category: "Productivity",
  },
  {
    id: "bookmarks",
    path: "/bookmarks",
    name: "Bookmarks",
    description: "Save and organize documentation, repos, and articles",
    icon: Bookmark,
    category: "Resources",
  },
  {
    id: "resources",
    path: "/resources",
    name: "Resources",
    description: "Save notes, prompts, code, and reusable configs",
    icon: NotebookText,
    category: "Resources",
  },
  {
    id: "json-formatter",
    path: "/json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON",
    icon: Braces,
    category: "Data",
  },
  {
    id: "json-to-typescript",
    path: "/json-to-typescript",
    name: "JSON to TypeScript",
    description: "Infer TypeScript interfaces or types from JSON",
    icon: FileCode,
    category: "Data",
  },
  {
    id: "http-tester",
    path: "/http-tester",
    name: "HTTP Tester",
    description: "Send HTTP requests and inspect responses (no CORS)",
    icon: Globe,
    category: "Network",
  },
  {
    id: "webhook-inspector",
    path: "/webhook-inspector",
    name: "Webhook Inspector",
    description: "Create temporary URLs that capture and inspect incoming HTTP requests",
    icon: Webhook,
    category: "Network",
  },
  {
    id: "uptime-monitor",
    path: "/uptime-monitor",
    name: "Uptime Monitor",
    description: "Monitor your URLs with scheduled HTTP checks and Telegram alerts",
    icon: Activity,
    category: "Network",
  },
  {
    id: "jwt-decoder",
    path: "/jwt-decoder",
    name: "JWT Decoder",
    description: "Decode and inspect JWT header and payload",
    icon: KeyRound,
    category: "Decoders",
  },
  {
    id: "regex-tester",
    path: "/regex-tester",
    name: "Regex Tester",
    description: "Test regex patterns with live highlighting and match details",
    icon: Regex,
    category: "Testers",
  },
  {
    id: "base64",
    path: "/base64",
    name: "Base64",
    description: "Encode and decode Base64 with UTF-8 support",
    icon: Binary,
    category: "Encoders",
  },
  {
    id: "mock-data-generator",
    path: "/mock-data-generator",
    name: "Mock Data Generator",
    description: "Generate fake JSON test data from a custom or preset schema",
    icon: Dices,
    category: "Generators",
  },
  {
    id: "password-generator",
    path: "/password-generator",
    name: "Password Generator",
    description: "Generate secure passwords locally in your browser",
    icon: KeyRound,
    category: "Generators",
  },
  {
    id: "image-tools",
    path: "/image-tools",
    name: "Image Tools",
    description: "Compress and convert PNG, JPG, and WebP images offline",
    icon: ImageIcon,
    category: "Media",
  },
];

export function getToolByPath(path: string): ToolDef | undefined {
  return tools.find((t) => t.path === path) ?? tools.find((t) => path.startsWith(`${t.path}/`));
}
