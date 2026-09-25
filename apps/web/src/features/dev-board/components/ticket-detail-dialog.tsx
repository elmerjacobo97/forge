"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";

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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { COLUMN_LABELS, PRIORITY_LABELS, type Ticket } from "../types/board";
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
          <>
            <Separator />
            <ScrollArea className="max-h-48">
              <p className="whitespace-pre-wrap pr-3 text-sm leading-relaxed">
                {ticket.description.trim() ? ticket.description : "No description."}
              </p>
            </ScrollArea>
            <ItemGroup className="gap-2">
              <Item
                variant="muted"
                size="sm"
              >
                <ItemContent>
                  <ItemTitle>Branch</ItemTitle>
                  <ItemDescription className="line-clamp-none font-mono text-xs">
                    {ticket.branch?.trim() ? ticket.branch : "No branch."}
                  </ItemDescription>
                </ItemContent>
              </Item>
              <Item
                variant="outline"
                size="sm"
                asChild={Boolean(ticket.prUrl)}
              >
                {ticket.prUrl ? (
                  <a
                    href={ticket.prUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ItemContent>
                      <ItemTitle>Pull request</ItemTitle>
                      <ItemDescription className="line-clamp-none break-all text-xs">
                        {ticket.prUrl}
                      </ItemDescription>
                    </ItemContent>
                  </a>
                ) : (
                  <ItemContent>
                    <ItemTitle>Pull request</ItemTitle>
                    <ItemDescription className="line-clamp-none text-xs">
                      No pull request.
                    </ItemDescription>
                  </ItemContent>
                )}
              </Item>
              <Item
                variant="muted"
                size="sm"
              >
                <ItemMedia variant="icon">
                  <HugeiconsIcon
                    icon={Message01Icon}
                    strokeWidth={2}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Latest comment</ItemTitle>
                  <ItemDescription className="line-clamp-none">
                    {comment
                      ? `${comment.author === "agent" ? "agent" : "you"} ${comment.excerpt}`
                      : "No comments."}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </>
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
