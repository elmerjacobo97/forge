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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UPTIME_DEFAULT_EXPECTED_STATUS,
  UPTIME_DEFAULT_FAILURE_THRESHOLD,
  UPTIME_DEFAULT_INTERVAL_MINUTES,
  UPTIME_FAILURE_THRESHOLD_MAX,
  UPTIME_FAILURE_THRESHOLD_MIN,
  UPTIME_INTERVALS_MINUTES,
} from "../constants";
import { useCreateUptimeMonitorMutation, useUpdateUptimeMonitorMutation } from "../hooks/mutations";
import {
  createUptimeMonitorSchema,
  type CreateUptimeMonitorInput,
} from "../schemas/uptime-monitor-schema";
import type { UptimeMonitor } from "../types";

type MonitorFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  monitor?: UptimeMonitor | null;
  disabled?: boolean;
};

function defaultsFor(monitor?: UptimeMonitor | null): CreateUptimeMonitorInput {
  if (!monitor) {
    return {
      name: "",
      url: "",
      method: "GET",
      expectedStatus: UPTIME_DEFAULT_EXPECTED_STATUS,
      intervalMinutes: UPTIME_DEFAULT_INTERVAL_MINUTES,
      failureThreshold: UPTIME_DEFAULT_FAILURE_THRESHOLD,
    };
  }
  return {
    name: monitor.name,
    url: monitor.url,
    method: monitor.method,
    expectedStatus: monitor.expectedStatus,
    intervalMinutes: monitor.intervalMinutes,
    failureThreshold: monitor.failureThreshold,
  };
}

export function MonitorFormDialog({
  isOpen,
  onOpenChange,
  monitor = null,
  disabled = false,
}: MonitorFormDialogProps) {
  const createMutation = useCreateUptimeMonitorMutation();
  const updateMutation = useUpdateUptimeMonitorMutation();
  const isEditing = monitor !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm({
    defaultValues: defaultsFor(monitor),
    validators: {
      onSubmit: createUptimeMonitorSchema,
    },
    onSubmit: async ({ value }) => {
      const onSuccess = () => {
        onOpenChange(false);
        form.reset();
      };
      if (isEditing) {
        updateMutation.mutate({ monitorId: monitor.id, input: value }, { onSuccess });
      } else {
        createMutation.mutate(value, { onSuccess });
      }
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit monitor" : "Create monitor"}</DialogTitle>
          <DialogDescription>
            Check a URL you own on a schedule and get alerted on Telegram when it goes down.
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
                  <Field data-invalid={isInvalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Marketing site"
                      maxLength={80}
                      disabled={disabled || isPending}
                      aria-invalid={isInvalid || undefined}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="url">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid || undefined}>
                    <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="https://example.com/health"
                      disabled={disabled || isPending}
                      aria-invalid={isInvalid || undefined}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="method">
                {(field) => (
                  <Field>
                    <FieldLabel>Method</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as "GET" | "HEAD")}
                    >
                      <SelectTrigger disabled={disabled || isPending}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="expectedStatus">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Expected status</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(Number(event.target.value))}
                        disabled={disabled || isPending}
                        aria-invalid={isInvalid || undefined}
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="intervalMinutes">
                {(field) => (
                  <Field>
                    <FieldLabel>Check interval</FieldLabel>
                    <Select
                      value={String(field.state.value)}
                      onValueChange={(value) =>
                        field.handleChange(
                          Number(value) as (typeof UPTIME_INTERVALS_MINUTES)[number],
                        )
                      }
                    >
                      <SelectTrigger disabled={disabled || isPending}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UPTIME_INTERVALS_MINUTES.map((minutes) => (
                          <SelectItem
                            key={minutes}
                            value={String(minutes)}
                          >
                            Every {minutes} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="failureThreshold">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Failure threshold</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={UPTIME_FAILURE_THRESHOLD_MIN}
                        max={UPTIME_FAILURE_THRESHOLD_MAX}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(Number(event.target.value))}
                        disabled={disabled || isPending}
                        aria-invalid={isInvalid || undefined}
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </form.Field>
            </div>
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
              {isPending ? "Saving…" : isEditing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
