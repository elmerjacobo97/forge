import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, Hammer, LogOut, Search, Settings, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { userQueryOptions } from "@/features/auth/hooks/queries";
import { useLogoutMutation } from "@/features/auth/hooks/mutations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { tools, type ToolDef } from "@/lib/tools";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface AppSidebarProps {
  activePath: string;
}

export function AppSidebar({ activePath }: AppSidebarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);
  const { data: user } = useQuery(userQueryOptions);
  const logoutMutation = useLogoutMutation();
  const grouped = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    const filtered = search
      ? tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(search) ||
            tool.description.toLowerCase().includes(search) ||
            tool.category.toLowerCase().includes(search),
        )
      : tools;
    const groups = new Map<string, ToolDef[]>();
    filtered.forEach((tool) => {
      groups.set(tool.category, [...(groups.get(tool.category) ?? []), tool]);
    });
    return [...groups.entries()];
  }, [debouncedQuery]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm ring-1 ring-primary/20">
            <Hammer className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-semibold tracking-tight">Forge</span>
            <span className="text-[10px] font-medium text-muted-foreground">dev toolkit</span>
          </span>
        </Link>
        <div className="relative px-2 py-2 group-data-[collapsible=icon]:hidden">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools..."
            className="h-8 pl-8 text-xs"
            type="search"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {grouped.map(([category, items]) => (
          <SidebarGroup key={category}>
            <SidebarGroupLabel>{category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((tool) => (
                  <SidebarMenuItem key={tool.id}>
                    <SidebarMenuButton asChild isActive={tool.path === activePath} tooltip={tool.name}>
                      <Link to={tool.path}>
                        <tool.icon />
                        <span>{tool.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2 p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <User className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-xs font-semibold">{user?.name || "Developer"}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{user?.email || ""}</span>
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
