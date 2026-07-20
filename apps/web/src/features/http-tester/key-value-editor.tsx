import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { KeyValue } from "@/features/http-tester/utils/history";

interface KeyValueEditorProps {
  pairs: KeyValue[];
  onChange: (pairs: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  function updatePair(
    index: number,
    field: keyof KeyValue,
    value: string | boolean,
  ) {
    onChange(pairs.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addPair() {
    onChange([
      ...pairs,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        key: "",
        value: "",
        enabled: true,
      },
    ]);
  }

  function removePair(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {pairs.map((pair, i) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Checkbox
            checked={pair.enabled}
            onCheckedChange={(checked) =>
              updatePair(i, "enabled", checked === true)
            }
            className="size-4 shrink-0"
          />
          <Input
            value={pair.key}
            onChange={(e) => updatePair(i, "key", e.target.value)}
            placeholder={keyPlaceholder}
            spellCheck={false}
            className={cn(
              "h-8 flex-1 font-mono text-xs",
              !pair.enabled && "opacity-40",
            )}
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(i, "value", e.target.value)}
            placeholder={valuePlaceholder}
            spellCheck={false}
            className={cn(
              "h-8 flex-1 font-mono text-xs",
              !pair.enabled && "opacity-40",
            )}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => removePair(i)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={addPair}
        className="h-8 w-fit gap-1.5 text-xs text-muted-foreground"
      >
        <Plus className="size-3.5" />
        Add row
      </Button>
    </div>
  );
}
