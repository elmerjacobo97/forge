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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type Priority, type Ticket, PRIORITIES, PRIORITY_LABELS } from "../types";
import { type TicketFormValues, ticketSchema } from "../schema";

interface TicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTicket: Ticket | null;
  onSubmit: (values: TicketFormValues) => void;
}

const formatErrors = (errors: unknown[]) => {
  return errors.map((error) => {
    if (typeof error === "string") return { message: error };
    if (error && typeof error === "object" && "message" in error) {
      return { message: String(error.message) };
    }
    return { message: error?.toString() || "Invalid value" };
  });
};

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
            }
          : { title: "", description: "", priority: "med" },
      );
    }
  }, [open, editTicket, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update ticket details, priority, or description."
              : "Create a ticket and track its time across your workflow."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="ticket-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="title"
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
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
                    {isInvalid && (
                      <FieldError errors={formatErrors(field.state.meta.errors)} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field
              name="description"
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional context, reproduction steps, or acceptance criteria…"
                    rows={3}
                    spellCheck={false}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="priority"
            >
              {(field) => (
                <Field>
                  <FieldLabel>Priority</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as Priority)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="ticket-form">
            {isEdit ? "Save changes" : "Create ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
