"use client";

import { useState, useTransition } from "react";
import { useForm, useStore } from "@tanstack/react-form";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { adjustTicketTimeAction } from "../actions";
import { useLastTimeEntry } from "../hooks/use-last-time-entry";
import { ticketTimeFormSchema, type TicketTimeAdjustInput } from "../schemas/ticket";
import type { TimeEntry } from "../types/analytics";
import { isTimerColumn, type Ticket } from "../types/board";
import {
  durationMsFromParts,
  durationParts,
  endTimeFromDuration,
  formatDuration,
  runningSegmentMs,
} from "../utils/timer";
import { adjustmentAddsComment } from "../utils/tickets";

const PRESETS = [
  { label: "30m", ms: 1_800_000 },
  { label: "1h", ms: 3_600_000 },
  { label: "2h", ms: 7_200_000 },
  { label: "4h", ms: 14_400_000 },
];

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface TicketTimeDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjusted: (ticket: Ticket, addsComment: boolean) => void;
}

export function TicketTimeDialog({
  ticket,
  open,
  onOpenChange,
  onAdjusted,
}: TicketTimeDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-h-[90vh] max-w-md grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md"
      >
        <DialogHeader className="min-w-0">
          <DialogTitle>Adjust time</DialogTitle>
          <DialogDescription className="line-clamp-2">{ticket?.title ?? ""}</DialogDescription>
        </DialogHeader>

        {ticket ? (
          <TicketTimeEditor
            key={ticket.id}
            ticket={ticket}
            onAdjusted={onAdjusted}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface TicketTimeEditorProps {
  ticket: Ticket;
  onAdjusted: (ticket: Ticket, addsComment: boolean) => void;
  onClose: () => void;
}

function TicketTimeEditor({ ticket, onAdjusted, onClose }: TicketTimeEditorProps) {
  const startedAt = ticket.timerStartedAt;
  const running = isTimerColumn(ticket.column) && startedAt !== null && !ticket.isPaused;
  const { entry, isLoading, error } = useLastTimeEntry(ticket.id, !running);

  if (running && startedAt) {
    return (
      <TicketTimeForm
        key={`${ticket.id}-running`}
        ticket={ticket}
        mode="running"
        startedAt={startedAt}
        initialMs={runningSegmentMs(ticket) ?? 0}
        onAdjusted={onAdjusted}
        onClose={onClose}
      />
    );
  }

  if (isLoading) {
    return <p className="py-2 text-sm text-muted-foreground">Loading last session...</p>;
  }

  if (error) {
    return <p className="py-2 text-sm text-destructive">{error}</p>;
  }

  if (entry) {
    return (
      <TicketTimeForm
        key={`${ticket.id}-${entry.id}`}
        ticket={ticket}
        mode="last"
        entry={entry}
        initialMs={entry.durationMs}
        onAdjusted={onAdjusted}
        onClose={onClose}
      />
    );
  }

  if (ticket.totalElapsedMs > 0) {
    return (
      <TicketTimeForm
        key={`${ticket.id}-total`}
        ticket={ticket}
        mode="total"
        initialMs={ticket.totalElapsedMs}
        onAdjusted={onAdjusted}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">No time logged on this ticket yet.</p>
      <DialogFooter className="sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}

type TicketTimeFormProps = {
  ticket: Ticket;
  initialMs: number;
  onAdjusted: (ticket: Ticket, addsComment: boolean) => void;
  onClose: () => void;
} & (
  { mode: "running"; startedAt: string } | { mode: "last"; entry: TimeEntry } | { mode: "total" }
);

function TicketTimeForm(props: TicketTimeFormProps) {
  const { ticket, initialMs, onAdjusted, onClose } = props;
  const [isSaving, startSaving] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const form = useForm({
    defaultValues: durationParts(initialMs),
    validators: {
      onSubmit: ticketTimeFormSchema,
    },
    onSubmit: async ({ value }) => {
      submit(buildPayload(value.hours, value.minutes, false));
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const durationMs = durationMsFromParts(values.hours, values.minutes);
  const maxMs = props.mode === "running" ? initialMs : null;
  const exceedsMax = maxMs !== null && durationMs > maxMs + 60_000;

  function buildPayload(hours: number, minutes: number, remove: boolean): TicketTimeAdjustInput {
    const requestedMs = durationMsFromParts(hours, minutes);

    if (props.mode === "running") {
      return {
        ticketId: ticket.id,
        action: "stop_at",
        endedAt: endTimeFromDuration(props.startedAt, requestedMs),
      };
    }
    if (props.mode === "last") {
      return remove
        ? { ticketId: ticket.id, action: "delete_last" }
        : { ticketId: ticket.id, action: "set_last_duration", durationMs: requestedMs };
    }
    return { ticketId: ticket.id, action: "set_total", durationMs: requestedMs };
  }

  function submit(payload: TicketTimeAdjustInput) {
    startSaving(async () => {
      const result = await adjustTicketTimeAction(payload);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Time adjusted.");
      onAdjusted(result.data, adjustmentAddsComment(payload));
      onClose();
    });
  }

  const sessionLabel =
    props.mode === "running"
      ? `Current session started ${formatClock(props.startedAt)} · ${formatDuration(runningSegmentMs(ticket) ?? 0)} so far`
      : props.mode === "last"
        ? `Last session: ${formatClock(props.entry.startedAt)} – ${formatClock(props.entry.endedAt)} · ${formatDuration(props.entry.durationMs)}`
        : `No sessions recorded · logged total ${formatDuration(ticket.totalElapsedMs)}`;

  const preview = exceedsMax
    ? `Exceeds current session (max ${formatDuration(maxMs)})`
    : props.mode === "running"
      ? `Ends at ${formatClock(endTimeFromDuration(props.startedAt, durationMs))}`
      : `New duration: ${formatDuration(durationMs)}`;

  const primaryLabel =
    props.mode === "running" ? "Stop timer" : props.mode === "last" ? "Save" : "Set total";

  return (
    <>
      <form
        className="-m-1 min-h-0 overflow-y-auto p-1"
        id="ticket-time-form"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <p className="text-sm text-muted-foreground">{sessionLabel}</p>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="hours">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Hours</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(Number(event.target.value))}
                      disabled={isSaving}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="minutes">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Minutes</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(Number(event.target.value))}
                      disabled={isSaving}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          {props.mode !== "total" && (
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={isSaving || (maxMs !== null && preset.ms > maxMs)}
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
          )}

          {props.mode === "running" && (
            <p className="text-xs text-muted-foreground">
              You can only shorten the running session.
            </p>
          )}

          <FieldDescription className={exceedsMax ? "text-destructive" : undefined}>
            {preview}
          </FieldDescription>

          {props.mode === "last" ? (
            <div className="flex items-center gap-2">
              {confirmRemove ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isSaving}
                    onClick={() => submit(buildPayload(values.hours, values.minutes, true))}
                  >
                    Confirm remove
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => setConfirmRemove(false)}
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
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove last session
                </Button>
              )}
            </div>
          ) : null}
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="ticket-time-form"
          disabled={isSaving || exceedsMax}
        >
          {isSaving ? "Saving…" : primaryLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
