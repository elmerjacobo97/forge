"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavUserProps {
  user: {
    name: string;
    email: string;
  };
  pending?: boolean;
  onSignOut: () => void;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) return "F";
  if (!last || parts.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function NavUser({ user, pending = false, onSignOut }: NavUserProps) {
  const { isMobile } = useSidebar();
  const label = initials(user.name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-none after:rounded-none">
                <AvatarFallback className="rounded-none">{label}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <HugeiconsIcon
                icon={UnfoldMoreIcon}
                strokeWidth={2}
                className="ml-auto group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem
              variant="destructive"
              onClick={onSignOut}
              disabled={pending}
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                strokeWidth={2}
              />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
