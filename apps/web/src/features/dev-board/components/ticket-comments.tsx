"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

import { createTicketCommentAction } from "../actions";
import { useTicketComments } from "../hooks/use-ticket-comments";
import type { TicketComment } from "../types/board";

interface TicketCommentsProps {
  ticketId: string;
  onCommentCreated?: (comment: TicketComment) => void;
}

function formatCommentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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
      {isLoading && (
        <p className="text-[11px] text-muted-foreground">Loading comments…</p>
      )}

      {!isLoading && error && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}

      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-input/50 bg-muted/30 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
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
              <p className="mt-1 whitespace-pre-wrap text-[11px]">{comment.body}</p>
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
          <InputGroupText className="tabular-nums text-xs">
            {body.length}/5000
          </InputGroupText>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || body.trim().length === 0}
          >
            <Send className="size-3" />
            Comment
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
