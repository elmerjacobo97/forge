"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldDescription, FieldGroup } from "@/components/ui/field";

import { useLastTimeEntry } from "../hooks/use-last-time-entry";
import { useTicketTimeForm } from "../hooks/use-ticket-time-form";
import type { TimeEntry } from "../types/analytics";
import { isTimerColumn, type Ticket } from "../types/board";
import { runningSegmentMs } from "../utils/timer";
import {
  timePreviewLabel,
  timePrimaryLabel,
  timeSessionLabel,
  type TicketTimeMode,
} from "../utils/ticket-time-form";
import {
  RemoveLastSession,
  TicketTimeDurationFields,
  TicketTimePresets,
} from "./ticket-time-fields";

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
  const target: TicketTimeMode = props;
  const {
    form,
    isSaving,
    confirmRemove,
    setConfirmRemove,
    durationMs,
    extendsSession,
    removeLastSession,
  } = useTicketTimeForm({ ticket, initialMs, target, onAdjusted, onClose });

  const sessionLabel = timeSessionLabel(ticket, target);
  const preview = timePreviewLabel(target, durationMs, extendsSession);
  const primaryLabel = timePrimaryLabel(target);

  return (
    <>
      <form
        className="-m-1 min-h-0 overflow-y-auto p-1"
        id="ticket-time-form"
        action={() => form.handleSubmit()}
      >
        <FieldGroup>
          <p className="text-sm text-muted-foreground">{sessionLabel}</p>

          <TicketTimeDurationFields
            form={form}
            isSaving={isSaving}
          />

          {props.mode !== "total" && (
            <TicketTimePresets
              form={form}
              isSaving={isSaving}
            />
          )}

          {props.mode === "running" && (
            <p className="text-xs text-muted-foreground">
              A longer duration moves the session start back so it ends now.
            </p>
          )}

          <FieldDescription>{preview}</FieldDescription>

          {props.mode === "last" ? (
            <RemoveLastSession
              confirmRemove={confirmRemove}
              isSaving={isSaving}
              onConfirm={removeLastSession}
              onConfirmChange={setConfirmRemove}
            />
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
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : primaryLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
