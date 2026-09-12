import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
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

import { type Priority, type Ticket, PRIORITIES, PRIORITY_LABELS } from "../types/board";
import { type TicketFormValues, ticketSchema } from "../schemas/ticket";

interface TicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTicket: Ticket | null;
  onSubmit: (values: TicketFormValues) => void;
}

export function TicketForm({
  open,
  onOpenChange,
  editTicket,
  onSubmit: onSubmitTicket,
}: TicketFormProps) {
  const isEdit = editTicket !== null;

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      priority: "med" as Priority,
      branch: null as string | null,
      prUrl: null as string | null,
    },
    validators: {
      onSubmit: ticketSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmitTicket(value);
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editTicket
          ? {
              title: editTicket.title,
              description: editTicket.description,
              priority: editTicket.priority,
              branch: editTicket.branch ?? "",
              prUrl: editTicket.prUrl ?? "",
            }
          : {
              title: "",
              description: "",
              priority: "med",
              branch: "",
              prUrl: "",
            },
      );
    }
  }, [open, editTicket, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] max-w-md grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update ticket details, priority, or description."
              : "Create a ticket and track its time across your workflow."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="-m-1 min-h-0 overflow-y-auto p-1"
          id="ticket-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
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
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="ticket-form"
          >
            {isEdit ? "Save changes" : "Create ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
