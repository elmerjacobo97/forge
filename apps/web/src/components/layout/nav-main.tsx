"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { tools, type ToolDef } from "@/lib/tools";

function isToolActive(path: string, activePath: string) {
  return activePath === path || activePath.startsWith(`${path}/`);
}

function groupTools(items: ToolDef[]) {
  const groups = new Map<string, ToolDef[]>();
  for (const tool of items) {
    groups.set(tool.category, [...(groups.get(tool.category) ?? []), tool]);
  }
  return [...groups.entries()];
}

export function NavMain({ activePath }: { activePath: string }) {
  const groups = groupTools(tools);

  return groups.map(([category, items]) => (
    <SidebarGroup key={category}>
      <SidebarGroupLabel>{category}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((tool) => (
            <SidebarMenuItem key={tool.id}>
              <SidebarMenuButton
                asChild
                isActive={isToolActive(tool.path, activePath)}
                tooltip={tool.name}
              >
                <Link href={tool.path}>
                  <HugeiconsIcon
                    icon={tool.icon}
                    strokeWidth={2}
                  />
                  <span>{tool.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
