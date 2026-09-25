"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTicketAction, updateTicketAction } from "../actions";
import type { TicketFormValues } from "../schemas/ticket";
import { COLUMN_LABELS, type Ticket } from "../types/board";
import type { ReviewInboxColumn, ReviewInboxItem } from "../types/review-inbox";
import { TicketDetailDialog } from "./ticket-detail-dialog";
import { TicketForm } from "./ticket-form";

const COLUMN_BADGE: Record<ReviewInboxColumn, string> = {
  validation:
    "border border-amber-500/30 bg-amber-500/10 px-1.5 text-amber-700 dark:text-amber-300",
  review: "border border-primary/30 bg-primary/10 px-1.5 text-primary",
};

export function ReviewInbox({ items }: { items: ReviewInboxItem[] }) {
  const [rows, setRows] = useState(items);
  const [selected, setSelected] = useState<ReviewInboxItem | null>(null);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [, startMutating] = useTransition();

  function openTicket(item: ReviewInboxItem) {
    startMutating(async () => {
      const result = await getTicketAction(item.ticketId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setSelected(item);
      setEditTicket(result.data);
      setDetailOpen(true);
    });
  }

  function openEditor() {
    setDetailOpen(false);
    setFormOpen(true);
  }

  function handleSubmit(values: TicketFormValues) {
    if (!editTicket) return;
    const current = editTicket;

    startMutating(async () => {
      const result = await updateTicketAction({ ...current, ...values });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setRows((currentRows) =>
        currentRows.map((row) =>
          row.ticketId === result.data.id
            ? { ...row, title: result.data.title, prUrl: result.data.prUrl }
            : row,
        ),
      );
      toast.success("Ticket updated.");
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="-ml-2 mb-1 h-7 gap-1.5 px-2"
        >
          <Link href="/dev-board">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Projects
          </Link>
        </Button>
        <h1 className="font-heading text-lg font-medium tracking-tight">Inbox</h1>
        <p className="text-xs text-muted-foreground">Tickets waiting in validation or review.</p>
      </div>

      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Nothing waiting in validation or review.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[14%]">Project</TableHead>
              <TableHead className="w-[22%]">Title</TableHead>
              <TableHead className="w-28">Column</TableHead>
              <TableHead className="w-16">PR</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.ticketId}>
                <TableCell className="max-w-0 align-top">
                  <Link
                    href={`/dev-board/${item.projectId}`}
                    className="block truncate hover:underline"
                  >
                    {item.projectName}
                  </Link>
                </TableCell>
                <TableCell className="max-w-0 align-top">
                  <button
                    type="button"
                    className="block max-w-full truncate text-left font-medium hover:underline"
                    onClick={() => openTicket(item)}
                  >
                    {item.title}
                  </button>
                </TableCell>
                <TableCell className="align-top">
                  <Badge className={COLUMN_BADGE[item.column]}>{COLUMN_LABELS[item.column]}</Badge>
                </TableCell>
                <TableCell className="align-top">
                  {item.prUrl ? (
                    <Badge
                      variant="outline"
                      asChild
                      className="border px-1.5"
                    >
                      <a
                        href={item.prUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PR
                      </a>
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-0 align-top whitespace-normal">
                  {item.comment ? (
                    <div className="flex min-w-0 flex-col gap-1">
                      <Badge
                        variant={item.comment.author === "agent" ? "secondary" : "outline"}
                        className="h-4 w-fit border px-1.5 normal-case tracking-normal"
                      >
                        {item.comment.author === "agent" ? "agent" : "you"}
                      </Badge>
                      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {item.comment.excerpt}
                      </p>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TicketDetailDialog
        ticket={editTicket}
        projectName={selected?.projectName ?? ""}
        comment={selected?.comment ?? null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEditor}
      />
      <TicketForm
        key={editTicket?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editTicket={editTicket}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
