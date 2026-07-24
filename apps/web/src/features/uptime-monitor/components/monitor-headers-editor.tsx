import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH,
  UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH,
  UPTIME_REQUEST_HEADERS_MAX,
} from "../constants";
import { requestHeaderInputSchema } from "../schemas/uptime-monitor-schema";
import type { RequestHeaderInput, RequestHeaderMetadata } from "../types";

type MonitorHeadersEditorProps = {
  value: RequestHeaderInput[];
  persistedHeaders: RequestHeaderMetadata[];
  onChange: (value: RequestHeaderInput[]) => void;
  disabled?: boolean;
};

function errorsFor(header: RequestHeaderInput, field: "name" | "value") {
  const result = requestHeaderInputSchema.safeParse(header);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => ({ message: issue.message }));
}

export function MonitorHeadersEditor({
  value,
  persistedHeaders,
  onChange,
  disabled = false,
}: MonitorHeadersEditorProps) {
  const persistedNames = new Set(persistedHeaders.map((header) => header.name.toLowerCase()));
  const nameCounts = new Map<string, number>();
  for (const header of value) {
    const normalized = header.name.toLowerCase();
    nameCounts.set(normalized, (nameCounts.get(normalized) ?? 0) + 1);
  }

  function updateHeader(index: number, header: RequestHeaderInput) {
    onChange(value.map((current, currentIndex) => (currentIndex === index ? header : current)));
  }

  function removeHeader(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <FieldSet>
      <FieldLegend variant="label">Custom request headers</FieldLegend>
      <div className="-mt-2 flex flex-wrap items-start justify-between gap-3">
        <FieldDescription className="max-w-md">
          Sent only over HTTPS. Saved values stay hidden; leave a configured value blank to keep it
          unchanged.
        </FieldDescription>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {value.length}/{UPTIME_REQUEST_HEADERS_MAX}
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onChange([...value, { name: "", value: "" }])}
            disabled={disabled || value.length >= UPTIME_REQUEST_HEADERS_MAX}
          >
            <Plus data-icon="inline-start" />
            Add header
          </Button>
        </div>
      </div>

      {value.length > 0 ? (
        <FieldGroup className="gap-3">
          {value.map((header, index) => {
            const normalizedName = header.name.toLowerCase();
            const isPersisted = persistedNames.has(normalizedName);
            const nameErrors = errorsFor(header, "name");
            if (normalizedName && (nameCounts.get(normalizedName) ?? 0) > 1) {
              nameErrors.push({ message: "Header names must be unique." });
            }
            const valueErrors = errorsFor(header, "value");
            const nameInvalid = nameErrors.length > 0;
            const valueInvalid = valueErrors.length > 0;
            const nameId = `request-header-${index}-name`;
            const valueId = `request-header-${index}-value`;

            return (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]"
              >
                <Field data-invalid={nameInvalid || undefined}>
                  <FieldLabel htmlFor={nameId}>Name</FieldLabel>
                  <Input
                    id={nameId}
                    value={header.name}
                    onChange={(event) =>
                      updateHeader(index, { ...header, name: event.target.value })
                    }
                    placeholder="Authorization"
                    maxLength={UPTIME_REQUEST_HEADER_NAME_MAX_LENGTH}
                    readOnly={isPersisted}
                    disabled={disabled}
                    autoComplete="off"
                    aria-invalid={nameInvalid || undefined}
                    aria-readonly={isPersisted || undefined}
                  />
                  {nameInvalid ? <FieldError errors={nameErrors} /> : null}
                </Field>

                <Field
                  className="col-span-2 sm:col-span-1"
                  data-invalid={valueInvalid || undefined}
                >
                  <FieldLabel htmlFor={valueId}>
                    {isPersisted ? "Replacement value" : "Value"}
                  </FieldLabel>
                  <Input
                    id={valueId}
                    type="password"
                    value={header.value ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      updateHeader(index, {
                        ...header,
                        value: isPersisted && nextValue === "" ? null : nextValue,
                      });
                    }}
                    placeholder={isPersisted ? "Configured - leave blank to keep" : "Header value"}
                    maxLength={UPTIME_REQUEST_HEADER_VALUE_MAX_LENGTH}
                    disabled={disabled}
                    autoComplete="new-password"
                    aria-invalid={valueInvalid || undefined}
                  />
                  {valueInvalid ? <FieldError errors={valueErrors} /> : null}
                </Field>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="col-start-2 row-start-1 self-end sm:col-start-3"
                  onClick={() => removeHeader(index)}
                  disabled={disabled}
                  aria-label={`Remove ${header.name || `header ${index + 1}`}`}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </FieldGroup>
      ) : (
        <FieldDescription>No custom headers configured.</FieldDescription>
      )}
    </FieldSet>
  );
}
