import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FIELD_TYPE_GROUPS,
  fieldHasOptions,
  getFieldDefaultOptions,
  getFieldOptionKeys,
  getFieldTypeLabel,
} from "./utils/field-types";
import type { FieldTypeId, SchemaField } from "./utils/types";

interface SchemaFieldRowProps {
  field: SchemaField;
  onChange: (field: SchemaField) => void;
  onRemove: () => void;
}

function OptionsEditor({
  field,
  onChange,
}: {
  field: SchemaField;
  onChange: (field: SchemaField) => void;
}) {
  const keys = getFieldOptionKeys(field.type);
  if (keys.length === 0) return null;

  const options = field.options ?? getFieldDefaultOptions(field.type);

  function updateOption(key: string, value: string) {
    const parsed =
      key === "values" ||
      key === "min" ||
      key === "max" ||
      key === "start" ||
      key === "years" ||
      key === "startYear" ||
      key === "endYear"
        ? value
        : value;
    onChange({ ...field, options: { ...options, [key]: parsed } });
  }

  return (
    <div className="flex items-center gap-1.5">
      {keys.map((key) => {
        const label =
          key === "values"
            ? "Values"
            : key === "startYear"
              ? "Start"
              : key === "endYear"
                ? "End"
                : key.charAt(0).toUpperCase() + key.slice(1);
        return (
          <Input
            key={key}
            value={String(options[key] ?? "")}
            onChange={(e) => updateOption(key, e.target.value)}
            placeholder={label}
            spellCheck={false}
            className="h-7 w-20 font-mono text-[11px]"
          />
        );
      })}
    </div>
  );
}

export function SchemaFieldRow({
  field,
  onChange,
  onRemove,
}: SchemaFieldRowProps) {
  function handleTypeChange(type: string) {
    const newType = type as FieldTypeId;
    const defaults = fieldHasOptions(newType)
      ? getFieldDefaultOptions(newType)
      : undefined;
    onChange({ ...field, type: newType, options: defaults });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={field.name}
        onChange={(e) => onChange({ ...field, name: e.target.value })}
        placeholder="Field name"
        spellCheck={false}
        className="h-8 min-w-0 flex-2 font-mono text-xs"
      />
      <Select value={field.type} onValueChange={handleTypeChange}>
        <SelectTrigger className="h-8 flex-2 text-xs" aria-label="Field type">
          <SelectValue>{getFieldTypeLabel(field.type)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FIELD_TYPE_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.ids.map((id) => (
                <SelectItem key={id} value={id}>
                  {getFieldTypeLabel(id)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {fieldHasOptions(field.type) && (
        <OptionsEditor field={field} onChange={onChange} />
      )}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={onRemove}
        className={cn(
          "shrink-0 text-muted-foreground hover:text-destructive",
          !fieldHasOptions(field.type) && undefined,
        )}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
