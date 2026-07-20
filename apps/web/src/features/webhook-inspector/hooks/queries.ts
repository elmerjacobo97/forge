"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  listWebhookEndpointsAction,
  listWebhookEventsAction,
} from "../actions";
import { WEBHOOK_POLL_INTERVAL_MS } from "../constants";
import { webhookInspectorKeys } from "./mutations";
import { usePageVisible } from "./use-page-visible";

export function useWebhookEndpointsQuery() {
  const user = useAuthUser();

  return useQuery({
    queryKey: webhookInspectorKeys.endpoints(user.id),
    queryFn: async () => {
      const result = await listWebhookEndpointsAction();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
  });
}

export function useWebhookEventsQuery(endpointId: string | null) {
  const user = useAuthUser();
  const visible = usePageVisible();

  return useQuery({
    queryKey: webhookInspectorKeys.events(user.id, endpointId ?? "none"),
    queryFn: async () => {
      if (!endpointId) return [];
      const result = await listWebhookEventsAction(endpointId);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: Boolean(endpointId),
    refetchInterval: endpointId && visible ? WEBHOOK_POLL_INTERVAL_MS : false,
  });
}
