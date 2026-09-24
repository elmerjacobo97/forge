import { LucideIcon, Bookmark, Lightbulb, Columns3, Webhook, Activity } from "lucide-react";

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
    id: "ideas",
    path: "/ideas",
    name: "Ideas",
    description: "Capture and track product, app, and business ideas",
    icon: Lightbulb,
    category: "Productivity",
  },
  {
    id: "resources",
    path: "/resources",
    name: "Resources",
    description: "Save and organize developer links and references",
    icon: Bookmark,
    category: "Resources",
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
];

export function getToolByPath(path: string): ToolDef | undefined {
  return tools.find((t) => t.path === path) ?? tools.find((t) => path.startsWith(`${t.path}/`));
}
