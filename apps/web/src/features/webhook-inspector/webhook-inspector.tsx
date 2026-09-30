"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CreateEndpointDialog } from "./components/create-endpoint-dialog";
import { DeleteEndpointDialog } from "./components/delete-endpoint-dialog";
import { EndpointsPanel } from "./components/endpoints-panel";
import { EventsPanel } from "./components/events-panel";
import { InspectorHeader } from "./components/inspector-header";
import { useWebhookInspector } from "./hooks/use-webhook-inspector";
import type { WebhookEndpoint } from "./types";

export function WebhookInspector({ initialEndpoints }: { initialEndpoints: WebhookEndpoint[] }) {
  const endpoints = initialEndpoints;
  const inspector = useWebhookInspector(endpoints);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <InspectorHeader
        activeCount={inspector.activeCount}
        atLimit={inspector.atLimit}
        onCreate={() => inspector.setIsCreateOpen(true)}
      />

      <ResizablePanelGroup
        orientation="vertical"
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          defaultSize={38}
          minSize={20}
          className="p-2"
        >
          <EndpointsPanel
            endpoints={endpoints}
            activeEndpointId={inspector.activeEndpointId}
            onCreate={() => inspector.setIsCreateOpen(true)}
            onSelect={inspector.selectEndpoint}
            onDelete={inspector.setDeleteTarget}
          />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-transparent"
        />

        <ResizablePanel
          defaultSize={62}
          minSize={24}
        >
          <EventsPanel
            selectedEndpoint={inspector.selectedEndpoint}
            events={inspector.events}
            activeEventId={inspector.activeEventId}
            selectedEvent={inspector.selectedEvent}
            isLoading={inspector.eventsLoading}
            error={inspector.eventsError}
            onSelectEvent={inspector.selectEvent}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <CreateEndpointDialog
        isOpen={inspector.isCreateOpen}
        onOpenChange={inspector.setIsCreateOpen}
        disabled={inspector.atLimit}
      />

      <DeleteEndpointDialog
        target={inspector.deleteTarget}
        isDeleting={inspector.isDeleting}
        onClose={() => inspector.setDeleteTarget(null)}
        onConfirm={inspector.confirmDelete}
      />
    </div>
  );
}
