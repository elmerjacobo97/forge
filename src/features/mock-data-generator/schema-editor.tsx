import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SchemaFieldRow } from "./schema-field-row";
import type { SchemaField } from "./utils/types";

interface SchemaEditorProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

export function SchemaEditor({ fields, onChange }: SchemaEditorProps) {
  function updateField(index: number, field: SchemaField) {
    onChange(fields.map((f, i) => (i === index ? field : f)));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function addField() {
    onChange([...fields, { name: "", type: "fullName" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, i) => (
        <SchemaFieldRow
          key={i}
          field={field}
          onChange={(f) => updateField(i, f)}
          onRemove={() => removeField(i)}
        />
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={addField}
        className="h-8 w-fit gap-1.5 text-xs text-muted-foreground"
      >
        <Plus className="size-3.5" />
        Add field
      </Button>
    </div>
  );
}
