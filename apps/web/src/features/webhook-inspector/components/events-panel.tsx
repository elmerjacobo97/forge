"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { WebhookIcon } from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { WebhookEndpoint, WebhookEvent } from "../types";
import { EventDetail } from "./event-detail";
import { EventFeed } from "./event-feed";

export function EventsPanel({
  selectedEndpoint,
  events,
  activeEventId,
  selectedEvent,
  isLoading,
  error,
  onSelectEvent,
}: {
  selectedEndpoint: WebhookEndpoint | null;
  events: WebhookEvent[];
  activeEventId: string | null;
  selectedEvent: WebhookEvent | null;
  isLoading: boolean;
  error: string | null;
  onSelectEvent: (event: WebhookEvent) => void;
}) {
  if (!selectedEndpoint) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 pt-0">
        <Label className="text-xs font-medium text-muted-foreground">Events</Label>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 border border-dashed border-input/40 bg-muted/10 p-6 text-center">
          <HugeiconsIcon
            icon={WebhookIcon}
            strokeWidth={2}
            className="size-8 text-muted-foreground/40"
          />
          <p className="text-sm font-medium">Select an endpoint</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Choose a webhook endpoint above to inspect captured HTTP requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 pt-0">
      <Label className="text-xs font-medium text-muted-foreground">
        Events · {selectedEndpoint.name.trim() || "Untitled endpoint"}
      </Label>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel
            defaultSize={36}
            minSize={20}
            className="pr-2"
          >
            <div className="h-full min-h-0 overflow-hidden border border-input/60 bg-muted/20">
              <EventFeed
                events={events}
                selectedId={activeEventId}
                onSelect={onSelectEvent}
                isLoading={isLoading}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-transparent"
          />

          <ResizablePanel
            defaultSize={64}
            minSize={30}
            className="pl-2"
          >
            <div className="h-full min-h-0 overflow-hidden border border-input/60 bg-muted/20">
              <EventDetail event={selectedEvent} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
