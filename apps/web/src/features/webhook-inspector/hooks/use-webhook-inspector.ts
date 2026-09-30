"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { WEBHOOK_MAX_ENDPOINTS_PER_USER } from "../constants";
import { deleteWebhookEndpointAction } from "../actions";
import type { WebhookEndpoint, WebhookEvent } from "../types";
import { isEndpointExpired } from "../utils/limits";
import { useWebhookEvents } from "./use-webhook-events";

export function useWebhookInspector(endpoints: WebhookEndpoint[]) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookEndpoint | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  // Resolve against live data during render (avoid effect setState cascades).
  const activeEndpointId =
    selectedEndpointId && endpoints.some((endpoint) => endpoint.id === selectedEndpointId)
      ? selectedEndpointId
      : null;

  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useWebhookEvents(activeEndpointId);

  const activeEventId =
    selectedEventId && events.some((event) => event.id === selectedEventId)
      ? selectedEventId
      : (events[0]?.id ?? null);

  const selectedEndpoint = endpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? null;
  const selectedEvent = events.find((event) => event.id === activeEventId) ?? null;

  const activeCount = useMemo(
    () => endpoints.filter((endpoint) => !isEndpointExpired(endpoint.expiresAt)).length,
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

    startDeleting(async () => {
      const result = await deleteWebhookEndpointAction(deleteTarget.id);
      if (!result.ok) {
        toast.error(result.message);
        setDeleteTarget(null);
        return;
      }

      toast.success("Webhook endpoint deleted.");
      setDeleteTarget(null);
      if (deletingSelected) {
        setSelectedEndpointId(null);
        setSelectedEventId(null);
      }
    });
  }

  return {
    isCreateOpen,
    setIsCreateOpen,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    activeEndpointId,
    activeEventId,
    events,
    eventsLoading,
    eventsError,
    selectedEndpoint,
    selectedEvent,
    activeCount,
    atLimit,
    selectEndpoint,
    selectEvent,
    confirmDelete,
  };
}
