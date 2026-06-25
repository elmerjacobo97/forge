import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

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

export function TicketForm({
  open,
  onOpenChange,
  editTicket,
  onSubmit,
}: TicketFormProps) {
  const isEdit = editTicket !== null;

  const form = useForm<TicketFormValues>({
    // @ts-expect-error — Zod v4 + @hookform/resolvers type mismatch on TS 5.x; runtime is fine
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "med" as Priority,
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

  function handleSubmit(values: TicketFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

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

        <form id="ticket-form" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ticket-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="ticket-title"
                    placeholder="e.g. Fix OAuth redirect loop"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="ticket-desc">Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="ticket-desc"
                    placeholder="Optional context, reproduction steps, or acceptance criteria…"
                    rows={3}
                    spellCheck={false}
                  />
                </Field>
              )}
            />

            <Controller
              name="priority"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
            />
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