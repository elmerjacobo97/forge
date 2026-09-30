import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { useTicketTimeForm } from "../hooks/use-ticket-time-form";
import { durationParts } from "../utils/timer";
import { TIME_PRESETS } from "../utils/ticket-time-form";

export type TicketTimeFormApi = ReturnType<typeof useTicketTimeForm>["form"];

function DurationInput({
  form,
  name,
  label,
  disabled,
}: {
  form: TicketTimeFormApi;
  name: "hours" | "minutes";
  label: string;
  disabled: boolean;
}) {
  return (
    <form.Field name={name}>
      {(field) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              min={0}
              inputMode="numeric"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(Number(event.target.value))}
              disabled={disabled}
              aria-invalid={isInvalid}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}

export function TicketTimeDurationFields({
  form,
  isSaving,
}: {
  form: TicketTimeFormApi;
  isSaving: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <DurationInput
        form={form}
        name="hours"
        label="Hours"
        disabled={isSaving}
      />
      <DurationInput
        form={form}
        name="minutes"
        label="Minutes"
        disabled={isSaving}
      />
    </div>
  );
}

export function TicketTimePresets({
  form,
  isSaving,
}: {
  form: TicketTimeFormApi;
  isSaving: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_PRESETS.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={isSaving}
          onClick={() => {
            const parts = durationParts(preset.ms);
            form.setFieldValue("hours", parts.hours);
            form.setFieldValue("minutes", parts.minutes);
          }}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

interface RemoveLastSessionProps {
  confirmRemove: boolean;
  isSaving: boolean;
  onConfirm: () => void;
  onConfirmChange: (value: boolean) => void;
}

export function RemoveLastSession({
  confirmRemove,
  isSaving,
  onConfirm,
  onConfirmChange,
}: RemoveLastSessionProps) {
  return (
    <div className="flex items-center gap-2">
      {confirmRemove ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isSaving}
            onClick={onConfirm}
          >
            Confirm remove
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isSaving}
            onClick={() => onConfirmChange(false)}
          >
            Keep
          </Button>
        </>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={isSaving}
          onClick={() => onConfirmChange(true)}
        >
          Remove last session
        </Button>
      )}
    </div>
  );
}
