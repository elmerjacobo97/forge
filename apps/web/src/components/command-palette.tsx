"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { tools } from "@/lib/tools";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  function selectTool(path: string) {
    router.push(path);
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search for a tool to open"
      className="max-h-[90vh] max-w-xl"
    >
      <Command>
        <CommandInput placeholder="Search tools..." />
        <CommandList>
          <CommandEmpty>No tools found.</CommandEmpty>
          <CommandGroup>
            {tools.map((tool) => (
              <CommandItem
                key={tool.id}
                value={`${tool.id} ${tool.name} ${tool.category}`}
                onSelect={() => selectTool(tool.path)}
              >
                <HugeiconsIcon
                  icon={tool.icon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
                <span className="flex-1 truncate">{tool.name}</span>
                <CommandShortcut>{tool.category}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
