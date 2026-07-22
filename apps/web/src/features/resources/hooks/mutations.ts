import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryOptions } from "@/features/auth/hooks/queries";
import type { AuthUser } from "@/features/auth/types";
import { resourcesService } from "../services/resources-service";
import type { Resource } from "../types";
import { toast } from "sonner";

export function useCreateResourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: Omit<Resource, "id" | "createdAt">) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return resourcesService.createResource(resource, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["resources", userId] });
      toast.success("Resource added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add resource.");
    },
  });
}

export function useUpdateResourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...resource }: { id: string } & Omit<Resource, "id" | "createdAt">) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return resourcesService.updateResource(id, resource, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["resources", userId] });
      toast.success("Resource updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update resource.");
    },
  });
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resourceId: string) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return resourcesService.deleteResource(resourceId, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["resources", userId] });
      toast.success("Resource deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete resource.");
    },
  });
}
