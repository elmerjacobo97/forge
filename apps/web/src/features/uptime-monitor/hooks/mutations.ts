"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuthUser } from "@/features/auth/components/auth-user-provider";
import {
  createUptimeMonitorAction,
  deleteUptimeMonitorAction,
  saveNotificationSettingsAction,
  sendTestTelegramMessageAction,
  setUptimeMonitorEnabledAction,
  updateUptimeMonitorAction,
} from "../actions";
import type { NotificationSettingsInput } from "../schemas/uptime-monitor-schema";
import type { CreateUptimeMonitorInput } from "../schemas/uptime-monitor-schema";
import type { UptimeMonitor } from "../types";

export const uptimeMonitorKeys = {
  all: ["uptime-monitor"] as const,
  monitors: (userId: string) => [...uptimeMonitorKeys.all, "monitors", userId] as const,
  checks: (userId: string, monitorId: string) =>
    [...uptimeMonitorKeys.all, "checks", userId, monitorId] as const,
  detail: (userId: string, monitorId: string, range: string) =>
    [...uptimeMonitorKeys.all, "detail", userId, monitorId, range] as const,
  settings: (userId: string) => [...uptimeMonitorKeys.all, "settings", userId] as const,
  sparklines: (userId: string, monitorIdsKey: string) =>
    [...uptimeMonitorKeys.all, "sparklines", userId, monitorIdsKey] as const,
};

export function useCreateUptimeMonitorMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async (input: CreateUptimeMonitorInput) => {
      const result = await createUptimeMonitorAction(input);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (monitor: UptimeMonitor) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: uptimeMonitorKeys.monitors(user.id),
        });
      }
      toast.success(`Monitor "${monitor.name}" created.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create monitor.");
    },
  });
}

export function useUpdateUptimeMonitorMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async ({
      monitorId,
      input,
    }: {
      monitorId: string;
      input: CreateUptimeMonitorInput;
    }) => {
      const result = await updateUptimeMonitorAction(monitorId, input);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (monitor: UptimeMonitor) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: uptimeMonitorKeys.monitors(user.id),
        });
      }
      toast.success(`Monitor "${monitor.name}" updated.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update monitor.");
    },
  });
}

export function useSetUptimeMonitorEnabledMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async ({ monitorId, enabled }: { monitorId: string; enabled: boolean }) => {
      const result = await setUptimeMonitorEnabledAction(monitorId, enabled);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (monitor: UptimeMonitor) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: uptimeMonitorKeys.monitors(user.id),
        });
      }
      toast.success(monitor.enabled ? "Monitor resumed." : "Monitor paused.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update monitor.");
    },
  });
}

export function useDeleteUptimeMonitorMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async (monitorId: string) => {
      const result = await deleteUptimeMonitorAction(monitorId);
      if (!result.ok) throw new Error(result.message);
      return monitorId;
    },
    onSuccess: (monitorId: string) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: uptimeMonitorKeys.monitors(user.id),
        });
        queryClient.removeQueries({
          queryKey: uptimeMonitorKeys.checks(user.id, monitorId),
        });
        queryClient.removeQueries({
          queryKey: [...uptimeMonitorKeys.all, "detail", user.id, monitorId],
        });
        void queryClient.invalidateQueries({
          queryKey: [...uptimeMonitorKeys.all, "sparklines", user.id],
        });
      }
      toast.success("Monitor deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete monitor.");
    },
  });
}

export function useSaveNotificationSettingsMutation() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: async (input: NotificationSettingsInput) => {
      const result = await saveNotificationSettingsAction(input);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: uptimeMonitorKeys.settings(user.id),
        });
      }
      toast.success("Telegram settings saved.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save notification settings.");
    },
  });
}

export function useSendTestTelegramMessageMutation() {
  return useMutation({
    mutationFn: async () => {
      const result = await sendTestTelegramMessageAction();
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => {
      toast.success("Test message sent.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send test message.");
    },
  });
}
