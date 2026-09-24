"use client";

import { useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { HammerIcon } from "@hugeicons/core-free-icons";

import { signOutAction } from "@/features/auth/actions";
import type { AuthUser } from "@/features/auth/types";
import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activePath: string;
  user: AuthUser;
  version: string;
}

export function AppSidebar({ activePath, user, version }: AppSidebarProps) {
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Forge"
            >
              <Link
                href="/"
                aria-label="Forge"
              >
                <div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                  <HugeiconsIcon
                    icon={HammerIcon}
                    strokeWidth={2}
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Forge</span>
                  <span className="truncate text-xs">dev toolkit</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain activePath={activePath} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name || "Developer",
            email: user.email,
          }}
          pending={isSigningOut}
          onSignOut={() => startSignOut(() => signOutAction())}
        />
        <span className="w-full px-2 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          v{version}
        </span>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
