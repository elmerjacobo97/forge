"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Markdown } from "@/components/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { createTicketCommentAction } from "../actions";
import { useTicketComments } from "../hooks/use-ticket-comments";
import type { TicketComment } from "../types/board";
import { formatLocalDateTime } from "../utils/planning-dates";

interface TicketCommentsProps {
  ticketId: string;
  onCommentCreated?: (comment: TicketComment) => void;
}

function formatCommentDate(value: string): string {
  return formatLocalDateTime(value) ?? value;
}

function CommentsSkeleton() {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-label="Loading comments"
    >
      <div className="flex flex-col gap-2 border border-input/50 bg-muted/30 p-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function TicketComments({ ticketId, onCommentCreated }: TicketCommentsProps) {
  const { comments, isLoading, error, appendComment } = useTicketComments(ticketId);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createTicketCommentAction(ticketId, trimmed);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      appendComment(result.data);
      onCommentCreated?.(result.data);
      setBody("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {isLoading && <CommentsSkeleton />}

      {!isLoading && error && <p className="text-[11px] text-destructive">{error}</p>}

      {!isLoading && !error && comments.length === 0 && (
        <p className="border border-dashed border-input/50 p-3 text-center text-xs text-muted-foreground">
          No comments yet.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className=" border border-input/50 bg-muted/30 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    " px-1.5 py-0.5 text-[10px] font-medium",
                    comment.author === "agent"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {comment.author === "agent" ? "agent" : "you"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatCommentDate(comment.createdAt)}
                </span>
              </div>
              <Markdown
                content={comment.body}
                className="mt-1"
              />
            </li>
          ))}
        </ul>
      )}

      <InputGroup>
        <InputGroupTextarea
          id="ticket-comment-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a comment…"
          rows={3}
          className="min-h-20 max-h-32 resize-y overflow-y-auto"
        />
        <InputGroupAddon
          align="block-end"
          className="justify-between"
        >
          <InputGroupText className="tabular-nums text-xs">{body.length}/5000</InputGroupText>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || body.trim().length === 0}
          >
            <HugeiconsIcon
              icon={SentIcon}
              strokeWidth={2}
              className="size-3"
            />
            Comment
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
