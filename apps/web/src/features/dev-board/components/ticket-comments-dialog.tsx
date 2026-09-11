"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Ticket, TicketComment } from "../types/board";
import { TicketComments } from "./ticket-comments";

interface TicketCommentsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentCreated?: (ticketId: string, comment: TicketComment) => void;
}

export function TicketCommentsDialog({
  ticket,
  open,
  onOpenChange,
  onCommentCreated,
}: TicketCommentsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] max-w-md grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription className="truncate">{ticket?.title ?? ""}</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 max-h-[50vh] overflow-y-auto px-4 py-1">
          {ticket ? (
            <TicketComments
              ticketId={ticket.id}
              onCommentCreated={(comment) => onCommentCreated?.(ticket.id, comment)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
