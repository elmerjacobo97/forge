"use client";

import { useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

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
import { createWebhookEndpointAction } from "../actions";
import {
  createWebhookEndpointSchema,
  type CreateWebhookEndpointInput,
} from "../schemas/webhook-inspector-schema";

type CreateEndpointDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
};

export function CreateEndpointDialog({
  isOpen,
  onOpenChange,
  disabled = false,
}: CreateEndpointDialogProps) {
  const [isPending, startCreating] = useTransition();

  const form = useForm({
    defaultValues: { name: "" } satisfies CreateWebhookEndpointInput,
    validators: {
      onSubmit: createWebhookEndpointSchema,
    },
    onSubmit: async ({ value }) => {
      startCreating(async () => {
        const result = await createWebhookEndpointAction(value);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(
          result.data.name
            ? `Endpoint "${result.data.name}" created.`
            : "Webhook endpoint created.",
        );
        onOpenChange(false);
        form.reset();
      });
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create webhook endpoint</DialogTitle>
          <DialogDescription>
            Get a temporary public URL that captures incoming HTTP requests for 7 days.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name (optional)</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Stripe webhooks"
                      maxLength={80}
                      disabled={disabled || isPending}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={disabled || isPending}
            >
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
