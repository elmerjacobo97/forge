"use client";

import { useMemo, useState } from "react";
import { Plus, Webhook } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WEBHOOK_MAX_ENDPOINTS_PER_USER } from "./constants";
import { CreateEndpointDialog } from "./components/create-endpoint-dialog";
import { EndpointRow } from "./components/endpoint-row";
import { EventDetail } from "./components/event-detail";
import { EventFeed } from "./components/event-feed";
import { useDeleteWebhookEndpointMutation } from "./hooks/mutations";
import {
  useWebhookEndpointsQuery,
  useWebhookEventsQuery,
} from "./hooks/queries";
import type { WebhookEndpoint, WebhookEvent } from "./types";
import { isEndpointExpired } from "./utils/limits";

export function WebhookInspector() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookEndpoint | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(
    null,
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: endpoints = [], isLoading, isError, error } =
    useWebhookEndpointsQuery();
  const deleteMutation = useDeleteWebhookEndpointMutation();

  // Resolve against live data during render (avoid effect setState cascades).
  const activeEndpointId =
    selectedEndpointId &&
    endpoints.some((endpoint) => endpoint.id === selectedEndpointId)
      ? selectedEndpointId
      : null;

  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsErrorValue,
  } = useWebhookEventsQuery(activeEndpointId);

  const activeEventId =
    selectedEventId && events.some((event) => event.id === selectedEventId)
      ? selectedEventId
      : (events[0]?.id ?? null);

  const selectedEndpoint =
    endpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? null;
  const selectedEvent =
    events.find((event) => event.id === activeEventId) ?? null;

  const activeCount = useMemo(
    () =>
      endpoints.filter((endpoint) => !isEndpointExpired(endpoint.expiresAt))
        .length,
    [endpoints],
  );
  const atLimit = activeCount >= WEBHOOK_MAX_ENDPOINTS_PER_USER;

  function selectEndpoint(endpoint: WebhookEndpoint) {
    setSelectedEndpointId(endpoint.id);
    setSelectedEventId(null);
  }

  function selectEvent(event: WebhookEvent) {
    setSelectedEventId(event.id);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const deletingSelected = deleteTarget.id === selectedEndpointId;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => {
        setDeleteTarget(null);
        if (deletingSelected) {
          setSelectedEndpointId(null);
          setSelectedEventId(null);
        }
      },
    });
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Webhook endpoints</h2>
          <p className="text-xs text-muted-foreground">
            {activeCount}/{WEBHOOK_MAX_ENDPOINTS_PER_USER} active · expire after 7
            days
          </p>
        </div>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setIsCreateOpen(true)}
          disabled={atLimit}
          title={
            atLimit
              ? `You can have at most ${WEBHOOK_MAX_ENDPOINTS_PER_USER} active endpoints.`
              : undefined
          }
        >
          <Plus data-icon="inline-start" />
          Create
        </Button>
      </div>

      {atLimit ? (
        <Alert>
          <AlertTitle>Active endpoint limit reached</AlertTitle>
          <AlertDescription>
            Delete or wait for an endpoint to expire before creating another (max{" "}
            {WEBHOOK_MAX_ENDPOINTS_PER_USER} active).
          </AlertDescription>
        </Alert>
      ) : null}

      <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={38} minSize={20} className="p-2">
          <div className="flex h-full min-h-0 flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Endpoints
            </Label>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-input/60 bg-muted/20 p-2">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="h-24 animate-pulse rounded-xl border border-border bg-card"
                    />
                  ))}
                </div>
              ) : endpoints.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Webhook className="size-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No webhook endpoints yet</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Create an endpoint to get a public URL that captures incoming
                    HTTP requests.
                  </p>
                  <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Create endpoint
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {endpoints.map((endpoint) => (
                    <EndpointRow
                      key={endpoint.id}
                      endpoint={endpoint}
                      selected={endpoint.id === activeEndpointId}
                      onSelect={selectEndpoint}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={62} minSize={24}>
          {selectedEndpoint ? (
            <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 pt-0">
              <Label className="text-xs font-medium text-muted-foreground">
                Events · {selectedEndpoint.name.trim() || "Untitled endpoint"}
              </Label>
              {eventsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not load events</AlertTitle>
                  <AlertDescription>
                    {eventsErrorValue.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <ResizablePanelGroup
                  orientation="horizontal"
                  className="min-h-0 flex-1"
                >
                  <ResizablePanel defaultSize={36} minSize={20} className="pr-2">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl border border-input/60 bg-muted/20">
                      <EventFeed
                        events={events}
                        selectedId={activeEventId}
                        onSelect={selectEvent}
                        isLoading={eventsLoading}
                      />
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle className="bg-transparent" />

                  <ResizablePanel defaultSize={64} minSize={30} className="pl-2">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl border border-input/60 bg-muted/20">
                      <EventDetail event={selectedEvent} />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 pt-0">
              <Label className="text-xs font-medium text-muted-foreground">
                Events
              </Label>
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input/40 bg-muted/10 p-6 text-center">
                <Webhook className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">Select an endpoint</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Choose a webhook endpoint above to inspect captured HTTP
                  requests.
                </p>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <CreateEndpointDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        disabled={atLimit}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete webhook endpoint?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name.trim() || "Untitled endpoint"}" and all captured events will be permanently removed.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
