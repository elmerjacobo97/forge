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

import type { Ticket } from "../types/board";
import { formatDuration } from "../utils/timer";

interface StaleMovePromptProps {
  ticket: Ticket | null;
  sessionMs: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjust: (ticket: Ticket) => void;
}

export function StaleMovePrompt({
  ticket,
  sessionMs,
  open,
  onOpenChange,
  onAdjust,
}: StaleMovePromptProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-w-md sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Long session logged</DialogTitle>
          <DialogDescription>
            {ticket
              ? `"${ticket.title}" ran for ${formatDuration(sessionMs)} before this move. Adjust the logged time?`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Keep
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (ticket) onAdjust(ticket);
            }}
          >
            Adjust
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
