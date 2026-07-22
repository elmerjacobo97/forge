"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  createWebhookEndpointAction,
  deleteWebhookEndpointAction,
} from "../actions";
import type { CreateWebhookEndpointInput } from "../schemas/webhook-inspector-schema";
import type { WebhookEndpoint } from "../types";

export const webhookInspectorKeys = {
  all: ["webhook-inspector"] as const,
  endpoints: (userId: string) =>
    [...webhookInspectorKeys.all, "endpoints", userId] as const,
  events: (userId: string, endpointId: string) =>
    [...webhookInspectorKeys.all, "events", userId, endpointId] as const,
};

export function useCreateWebhookEndpointMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async (input: CreateWebhookEndpointInput) => {
      const result = await createWebhookEndpointAction(input);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (endpoint: WebhookEndpoint) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: webhookInspectorKeys.endpoints(user.id),
        });
      }
      toast.success(
        endpoint.name
          ? `Endpoint "${endpoint.name}" created.`
          : "Webhook endpoint created.",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create webhook endpoint.");
    },
  });
}

export function useDeleteWebhookEndpointMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async (endpointId: string) => {
      const result = await deleteWebhookEndpointAction(endpointId);
      if (!result.ok) throw new Error(result.message);
      return endpointId;
    },
    onSuccess: (endpointId: string) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: webhookInspectorKeys.endpoints(user.id),
        });
        queryClient.removeQueries({
          queryKey: webhookInspectorKeys.events(user.id, endpointId),
        });
      }
      toast.success("Webhook endpoint deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete webhook endpoint.");
    },
  });
}
