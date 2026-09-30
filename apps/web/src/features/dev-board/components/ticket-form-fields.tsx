import type { ComponentProps } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type Priority,
  type TicketComplexity,
  COMPLEXITY_LABELS,
  COMPLEXITY_LEVELS,
  PRIORITIES,
  PRIORITY_LABELS,
} from "../types/board";
import type { PlanningDateErrors, useTicketForm } from "../hooks/use-ticket-form";
import { localDateTimeInputToIso, toLocalDateTimeInput } from "../utils/planning-dates";

export type TicketFormApi = ReturnType<typeof useTicketForm>["form"];

interface PlanningDateInputProps {
  field: {
    name: string;
    state: {
      value: string | null;
      meta: { isValid: boolean; errors: ComponentProps<typeof FieldError>["errors"] & unknown[] };
    };
    handleBlur: () => void;
    handleChange: (value: string | null) => void;
  };
  label: string;
  dateError: string | undefined;
  onDateErrorChange: (message: string | undefined) => void;
}

function PlanningDateInput({ field, label, dateError, onDateErrorChange }: PlanningDateInputProps) {
  const isInvalid = Boolean(dateError) || !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="datetime-local"
        step={60}
        value={toLocalDateTimeInput(field.state.value)}
        onBlur={field.handleBlur}
        onChange={(event) => {
          try {
            field.handleChange(localDateTimeInputToIso(event.target.value));
            onDateErrorChange(undefined);
          } catch (error) {
            onDateErrorChange(
              error instanceof Error ? error.message : "Choose a valid local date and time.",
            );
          }
        }}
        aria-invalid={isInvalid}
      />
      <FieldDescription>Optional; entered in your local time zone.</FieldDescription>
      {dateError ? (
        <FieldError>{dateError}</FieldError>
      ) : (
        field.state.meta.errors.length > 0 && <FieldError errors={field.state.meta.errors} />
      )}
    </Field>
  );
}

export function TicketBasicFields({ form }: { form: TicketFormApi }) {
  return (
    <>
      <form.Field name="title">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Fix OAuth redirect loop"
                autoComplete="off"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="description">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Optional context, reproduction steps, or acceptance criteria…"
                  rows={3}
                  spellCheck={false}
                  className="max-h-48 resize-y overflow-y-auto"
                  aria-invalid={isInvalid}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {field.state.value.length}/2000 characters
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="priority">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Priority</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as Priority)}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={isInvalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                    >
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
    </>
  );
}

interface TicketPlanningFieldsProps {
  form: TicketFormApi;
  planningDateErrors: PlanningDateErrors;
  onPlanningDateError: (field: "startDate" | "dueDate", message: string | undefined) => void;
}

export function TicketPlanningFields({
  form,
  planningDateErrors,
  onPlanningDateError,
}: TicketPlanningFieldsProps) {
  return (
    <>
      <form.Field name="startDate">
        {(field) => (
          <PlanningDateInput
            field={field}
            label="Start Date"
            dateError={planningDateErrors.startDate}
            onDateErrorChange={(message) => onPlanningDateError("startDate", message)}
          />
        )}
      </form.Field>

      <form.Field name="dueDate">
        {(field) => (
          <PlanningDateInput
            field={field}
            label="Due Date"
            dateError={planningDateErrors.dueDate}
            onDateErrorChange={(message) => onPlanningDateError("dueDate", message)}
          />
        )}
      </form.Field>

      <form.Field name="complexity">
        {(field) => {
          const isInvalid = !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Complexity</FieldLabel>
              <Select
                value={field.state.value ?? "none"}
                onValueChange={(value) =>
                  field.handleChange(value === "none" ? null : (value as TicketComplexity))
                }
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={isInvalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {COMPLEXITY_LEVELS.map((complexity) => (
                    <SelectItem
                      key={complexity}
                      value={complexity}
                    >
                      {COMPLEXITY_LABELS[complexity]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Optional estimate of the work effort.</FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
    </>
  );
}

export function TicketOwnerFields({ form, isEdit }: { form: TicketFormApi; isEdit: boolean }) {
  return (
    <>
      <form.Field name="responsibleName">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Responsible</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Optional name"
                autoComplete="off"
                maxLength={120}
                aria-invalid={isInvalid}
              />
              <p className="text-xs text-muted-foreground">Text only; not a Forge account.</p>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {isEdit && (
        <>
          <form.Field name="branch">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Branch</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. dev/handoff"
                    autoComplete="off"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="prUrl">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>PR URL</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://github.com/acme/forge/pull/123"
                    autoComplete="off"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </>
      )}
    </>
  );
}
