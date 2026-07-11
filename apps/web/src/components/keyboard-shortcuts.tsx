import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutDef {
  description: string
  keys: string[]
}

function isMac() {
  if (typeof navigator === "undefined") return false
  return navigator.platform.toLowerCase().startsWith("mac")
}

const shortcuts: ShortcutDef[] = [
  { description: "Open command palette", keys: ["Cmd", "K"] },
  { description: "Open keyboard shortcuts", keys: ["Cmd", "/"] },
  { description: "Close dialogs and menus", keys: ["Esc"] },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const mac = isMac()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Quick ways to move around Forge.</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-1">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50"
            >
              <span className="text-sm">{shortcut.description}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key) => {
                  if (key === "Cmd") {
                    return (
                      <Kbd key={key}>
                        {mac ? (
                          <span className="flex items-center gap-0.5">
                            <span>⌘</span>
                            <span className="hidden sm:inline">Cmd</span>
                          </span>
                        ) : (
                          "Ctrl"
                        )}
                      </Kbd>
                    )
                  }
                  return <Kbd key={key}>{key}</Kbd>
                })}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
