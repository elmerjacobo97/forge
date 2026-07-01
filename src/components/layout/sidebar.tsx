import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Hammer, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { tools, type ToolDef } from "@/lib/tools";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface SidebarProps {
  activePath: string;
}

export function Sidebar({ activePath }: SidebarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  const grouped = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const filtered = q
      ? tools.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        )
      : tools;
    const map = new Map<string, ToolDef[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return [...map.entries()];
  }, [debouncedQuery]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm ring-1 ring-primary/20">
          <Hammer className="size-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-heading text-sm font-semibold tracking-tight">
            Forge
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            dev toolkit
          </span>
        </div>
      </div>

      <div className="shrink-0 px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="h-8 pl-8 text-xs"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-5 px-3 pb-4">
          {grouped.map(([category, items]) => (
            <div key={category} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {category}
                </span>
                <Badge
                  variant="ghost"
                  className="h-4 px-1.5 text-[10px] text-muted-foreground"
                >
                  {items.length}
                </Badge>
              </div>
              {items.map((tool) => (
                <SidebarItem
                  key={tool.id}
                  tool={tool}
                  active={tool.path === activePath}
                />
              ))}
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No tools found.
            </p>
          )}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex">
        {content}
      </aside>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-3 top-3 z-50 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarItem({
  tool,
  active,
}: {
  tool: ToolDef;
  active: boolean;
}) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.path}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-all",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="truncate">{tool.name}</span>
    </Link>
  );
}
