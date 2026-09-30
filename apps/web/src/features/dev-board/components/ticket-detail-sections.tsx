import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon } from "@hugeicons/core-free-icons";

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
import { COMPLEXITY_LABELS, type Ticket } from "../types/board";
import { formatLocalDateTime } from "../utils/planning-dates";
import type { ReviewInboxComment } from "../types/review-inbox";

function TicketPlanningItem({ ticket }: { ticket: Ticket }) {
  const startDateLabel = formatLocalDateTime(ticket.startDate);
  const dueDateLabel = formatLocalDateTime(ticket.dueDate);

  return (
    <Item
      variant="muted"
      size="sm"
    >
      <ItemContent>
        <ItemTitle>Planning</ItemTitle>
        <ItemDescription className="line-clamp-none">
          <span className="block">
            <span className="font-medium">Complexity:</span>{" "}
            {ticket.complexity ? COMPLEXITY_LABELS[ticket.complexity] : "Not set"}
          </span>
          <span className="block">
            <span className="font-medium">Start Date:</span>{" "}
            {startDateLabel && ticket.startDate ? (
              <time dateTime={ticket.startDate}>{startDateLabel}</time>
            ) : (
              "Not scheduled"
            )}
          </span>
          <span className="block">
            <span className="font-medium">Due Date:</span>{" "}
            {dueDateLabel && ticket.dueDate ? (
              <time dateTime={ticket.dueDate}>{dueDateLabel}</time>
            ) : (
              "Not scheduled"
            )}
          </span>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

function TicketPullRequestItem({ prUrl }: { prUrl: string | null }) {
  return (
    <Item
      variant="outline"
      size="sm"
      asChild={Boolean(prUrl)}
    >
      {prUrl ? (
        <a
          href={prUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ItemContent>
            <ItemTitle>Pull request</ItemTitle>
            <ItemDescription className="line-clamp-none break-all text-xs">{prUrl}</ItemDescription>
          </ItemContent>
        </a>
      ) : (
        <ItemContent>
          <ItemTitle>Pull request</ItemTitle>
          <ItemDescription className="line-clamp-none text-xs">No pull request.</ItemDescription>
        </ItemContent>
      )}
    </Item>
  );
}

function TicketLatestCommentItem({ comment }: { comment: ReviewInboxComment | null }) {
  return (
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
  );
}

export function TicketDetailBody({
  ticket,
  comment,
}: {
  ticket: Ticket;
  comment: ReviewInboxComment | null;
}) {
  return (
    <>
      <Separator />
      <ScrollArea className="max-h-48">
        <p className="whitespace-pre-wrap pr-3 text-sm leading-relaxed">
          {ticket.description.trim() ? ticket.description : "No description."}
        </p>
      </ScrollArea>
      <ItemGroup className="gap-2">
        <TicketPlanningItem ticket={ticket} />
        <Item
          variant="muted"
          size="sm"
        >
          <ItemContent>
            <ItemTitle>Responsible</ItemTitle>
            <ItemDescription className="line-clamp-none">
              {ticket.responsibleName ?? "No responsible person."}
            </ItemDescription>
          </ItemContent>
        </Item>
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
        <TicketPullRequestItem prUrl={ticket.prUrl} />
        <TicketLatestCommentItem comment={comment} />
      </ItemGroup>
    </>
  );
}
