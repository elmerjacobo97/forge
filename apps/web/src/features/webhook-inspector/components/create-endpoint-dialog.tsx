"use client";

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
import { useCreateWebhookEndpointMutation } from "../hooks/mutations";
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
  const createMutation = useCreateWebhookEndpointMutation();

  const form = useForm({
    defaultValues: { name: "" } satisfies CreateWebhookEndpointInput,
    validators: {
      onSubmit: createWebhookEndpointSchema,
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create webhook endpoint</DialogTitle>
          <DialogDescription>
            Get a temporary public URL that captures incoming HTTP requests for 7
            days.
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
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Name (optional)</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Stripe webhooks"
                      maxLength={80}
                      disabled={disabled || createMutation.isPending}
                      aria-invalid={isInvalid || undefined}
                    />
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={disabled || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
