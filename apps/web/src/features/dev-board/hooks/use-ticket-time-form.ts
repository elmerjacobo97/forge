import { useState, useTransition } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { toast } from "sonner";

import { adjustTicketTimeAction } from "../actions";
import { ticketTimeFormSchema, type TicketTimeAdjustInput } from "../schemas/ticket";
import type { Ticket } from "../types/board";
import { durationMsFromParts, durationParts } from "../utils/timer";
import { buildTimePayload, type TicketTimeMode } from "../utils/ticket-time-form";

interface UseTicketTimeFormOptions {
  ticket: Ticket;
  initialMs: number;
  target: TicketTimeMode;
  onAdjusted: (ticket: Ticket) => void;
  onClose: () => void;
}

export function useTicketTimeForm({
  ticket,
  initialMs,
  target,
  onAdjusted,
  onClose,
}: UseTicketTimeFormOptions) {
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
  const extendsSession = target.mode === "running" && durationMs > initialMs + 60_000;

  function buildPayload(hours: number, minutes: number, remove: boolean): TicketTimeAdjustInput {
    return buildTimePayload(
      ticket.id,
      target,
      initialMs,
      durationMsFromParts(hours, minutes),
      remove,
    );
  }

  function submit(payload: TicketTimeAdjustInput) {
    startSaving(async () => {
      const result = await adjustTicketTimeAction(payload);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Time adjusted.");
      onAdjusted(result.data);
      onClose();
    });
  }

  function removeLastSession() {
    submit(buildPayload(values.hours, values.minutes, true));
  }

  return {
    form,
    isSaving,
    confirmRemove,
    setConfirmRemove,
    durationMs,
    extendsSession,
    removeLastSession,
  };
}
