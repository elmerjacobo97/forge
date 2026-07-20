"use client";

import { Fragment } from "react";
import { format } from "date-fns";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { WebhookEvent } from "../types";

type EventFeedProps = {
  events: WebhookEvent[];
  selectedId: string | null;
  onSelect: (event: WebhookEvent) => void;
  isLoading?: boolean;
};

export function EventFeed({
  events,
  selectedId,
  onSelect,
  isLoading = false,
}: EventFeedProps) {
  if (isLoading) {
    return (
      <ItemGroup className="gap-2 p-3" data-size="sm">
        {[1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </ItemGroup>
    );
  }

  if (events.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No events yet</EmptyTitle>
          <EmptyDescription className="text-xs">
            Send a request to this endpoint URL. New events appear here within
            about 2 seconds while this tab is visible.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ScrollArea className="h-full">
      <ItemGroup className="gap-0 p-2" data-size="sm">
        {events.map((event, index) => {
          const selected = event.id === selectedId;
          return (
            <Fragment key={event.id}>
              <Item
                asChild
                variant={selected ? "muted" : "default"}
                size="sm"
                className="cursor-pointer hover:bg-accent/40"
              >
                <button type="button" onClick={() => onSelect(event)}>
                  <ItemContent>
                    <ItemTitle className="w-full max-w-full">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {event.method}
                      </Badge>
                      <span className="truncate font-mono text-xs font-normal text-muted-foreground">
                        {event.path}
                      </span>
                    </ItemTitle>
                    <ItemDescription className="text-[11px]">
                      {format(new Date(event.receivedAt), "MMM d, HH:mm:ss")}
                    </ItemDescription>
                  </ItemContent>
                </button>
              </Item>
              {index < events.length - 1 ? (
                <ItemSeparator className="my-1" />
              ) : null}
            </Fragment>
          );
        })}
      </ItemGroup>
    </ScrollArea>
  );
}
