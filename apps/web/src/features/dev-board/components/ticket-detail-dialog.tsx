"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon } from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COLUMN_LABELS, PRIORITY_LABELS, type Ticket } from "../types/board";
import { TicketDetailBody } from "./ticket-detail-sections";
import type { ReviewInboxColumn, ReviewInboxComment } from "../types/review-inbox";

const COLUMN_BADGE: Record<ReviewInboxColumn, string> = {
  validation:
    "border border-amber-500/30 bg-amber-500/10 px-1.5 text-amber-700 normal-case tracking-normal dark:text-amber-300",
  review: "border border-primary/30 bg-primary/10 px-1.5 text-primary normal-case tracking-normal",
};

export function TicketDetailDialog({
  ticket,
  projectName,
  comment,
  open,
  onOpenChange,
  onEdit,
}: {
  ticket: Ticket | null;
  projectName: string;
  comment: ReviewInboxComment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  const column =
    ticket?.column === "validation" || ticket?.column === "review" ? ticket.column : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>{ticket?.title ?? "Ticket"}</DialogTitle>
          <DialogDescription>{projectName}</DialogDescription>
          {ticket ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {column ? (
                <Badge className={COLUMN_BADGE[column]}>{COLUMN_LABELS[ticket.column]}</Badge>
              ) : null}
              <Badge
                variant="outline"
                className="border px-1.5 normal-case tracking-normal"
              >
                {PRIORITY_LABELS[ticket.priority]}
              </Badge>
            </div>
          ) : null}
        </DialogHeader>

        {ticket ? (
          <TicketDetailBody
            ticket={ticket}
            comment={comment}
          />
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            disabled={!ticket}
            className="gap-1.5"
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
