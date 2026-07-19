import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { userQueryOptions } from "@/features/auth/hooks/queries";
import type { AuthUser } from "@/features/auth/types";

import { devBoardService, type TicketPage } from "../services/dev-board-service";
import { projectsService } from "../services/projects-service";
import type { Ticket } from "../types/board";
import type { Project, ProjectCreateInput, ProjectUpdateInput } from "../types/project";
import { devBoardKeys, devBoardMutationKeys, isColumnQueryKey } from "./queries";

function restoreCachedTickets(
  queryClient: ReturnType<typeof useQueryClient>,
  previous: [readonly unknown[], InfiniteData<TicketPage> | undefined][],
): void {
  previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

function getUserId(queryClient: ReturnType<typeof useQueryClient>): string | undefined {
  return queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
}

function findCachedTicket(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  ticketId: string,
): Ticket | undefined {
  const cachedQueries = queryClient.getQueriesData<InfiniteData<TicketPage>>({
    queryKey: devBoardKeys.user(userId),
    predicate: (query) => isColumnQueryKey(query.queryKey),
  });
  for (const [, data] of cachedQueries) {
    const ticket = data?.pages.flatMap((page) => page.tickets).find((item) => item.id === ticketId);
    if (ticket) return ticket;
  }
  return undefined;
}

function updateCachedTicket(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  ticket: Ticket,
): void {
  const previousTicket = findCachedTicket(queryClient, userId, ticket.id);
  if (!previousTicket) return;
  const projectId = previousTicket.projectId;

  if (previousTicket.column === ticket.column) {
    queryClient.setQueryData<InfiniteData<TicketPage>>(
      devBoardKeys.column(userId, projectId, ticket.column),
      (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                tickets: page.tickets.map((item) => (item.id === ticket.id ? ticket : item)),
              })),
            }
          : current,
    );
    return;
  }

  queryClient.setQueryData<InfiniteData<TicketPage>>(
    devBoardKeys.column(userId, projectId, previousTicket.column),
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              tickets: page.tickets.filter((item) => item.id !== ticket.id),
              total: Math.max(0, page.total - 1),
            })),
          }
        : current,
  );
  queryClient.setQueryData<InfiniteData<TicketPage>>(
    devBoardKeys.column(userId, projectId, ticket.column),
    (current) => {
      if (!current || current.pages.length === 0) return current;
      const [firstPage, ...rest] = current.pages;
      return {
        ...current,
        pages: [
          {
            ...firstPage,
            tickets: [ticket, ...firstPage.tickets].sort((a, b) => b.position - a.position),
            total: firstPage.total + 1,
          },
          ...rest,
        ],
      };
    },
  );
}

function invalidateProjectAnalytics(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  projectId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...devBoardKeys.project(userId, projectId), "analytics"],
  });
}

export function useUpdateDevBoardTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: devBoardMutationKeys.update,
    mutationFn: async (ticket: Ticket) => {
      const userId = getUserId(queryClient);
      if (!userId) throw new Error("You must be signed in to update tickets.");
      return devBoardService.updateTicket(ticket, userId);
    },
    onMutate: async (ticket) => {
      const userId = getUserId(queryClient);
      if (!userId) return [];
      await queryClient.cancelQueries({
        queryKey: devBoardKeys.project(userId, ticket.projectId),
      });
      const previous = queryClient.getQueriesData<InfiniteData<TicketPage>>({
        queryKey: devBoardKeys.project(userId, ticket.projectId),
        predicate: (query) => isColumnQueryKey(query.queryKey),
      });
      updateCachedTicket(queryClient, userId, ticket);
      return previous;
    },
    onError: (error: Error, _ticket, previous) => {
      restoreCachedTickets(queryClient, previous ?? []);
      toast.error(error.message || "Failed to save ticket.");
    },
    onSettled: (_data, _error, ticket) => {
      const userId = getUserId(queryClient);
      if (userId) invalidateProjectAnalytics(queryClient, userId, ticket.projectId);
    },
  });
}

export function useCreateDevBoardTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: Ticket) => {
      const userId = getUserId(queryClient);
      if (!userId) throw new Error("You must be signed in to create tickets.");
      return devBoardService.createTicket(ticket, userId);
    },
    onMutate: async (ticket) => {
      const userId = getUserId(queryClient);
      if (!userId) return [];
      await queryClient.cancelQueries({
        queryKey: devBoardKeys.column(userId, ticket.projectId, "backlog"),
      });
      const previous = queryClient.getQueriesData<InfiniteData<TicketPage>>({
        queryKey: devBoardKeys.project(userId, ticket.projectId),
        predicate: (query) => isColumnQueryKey(query.queryKey),
      });
      queryClient.setQueryData<InfiniteData<TicketPage>>(
        devBoardKeys.column(userId, ticket.projectId, "backlog"),
        (current) => {
          if (!current || current.pages.length === 0) return current;
          const [firstPage, ...rest] = current.pages;
          return {
            ...current,
            pages: [
              {
                ...firstPage,
                tickets: [ticket, ...firstPage.tickets].sort((a, b) => b.position - a.position),
                total: firstPage.total + 1,
              },
              ...rest,
            ],
          };
        },
      );
      return previous;
    },
    onError: (error: Error, _ticket, previous) => {
      restoreCachedTickets(queryClient, previous ?? []);
      toast.error(error.message || "Failed to create ticket.");
    },
    onSettled: (_data, _error, ticket) => {
      const userId = getUserId(queryClient);
      if (userId) invalidateProjectAnalytics(queryClient, userId, ticket.projectId);
    },
  });
}

export function useDeleteDevBoardTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => devBoardService.deleteTicket(ticketId),
    onMutate: async (ticketId) => {
      const userId = getUserId(queryClient);
      if (!userId) return { previous: [], projectId: undefined as string | undefined };
      const existing = findCachedTicket(queryClient, userId, ticketId);
      const projectId = existing?.projectId;
      if (!projectId) return { previous: [], projectId };

      await queryClient.cancelQueries({ queryKey: devBoardKeys.project(userId, projectId) });
      const previous = queryClient.getQueriesData<InfiniteData<TicketPage>>({
        queryKey: devBoardKeys.project(userId, projectId),
        predicate: (query) => isColumnQueryKey(query.queryKey),
      });
      queryClient.setQueriesData<InfiniteData<TicketPage>>(
        {
          queryKey: devBoardKeys.project(userId, projectId),
          predicate: (query) => isColumnQueryKey(query.queryKey),
        },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  tickets: page.tickets.filter((ticket) => ticket.id !== ticketId),
                })),
              }
            : current,
      );
      return { previous, projectId };
    },
    onError: (error: Error, _ticketId, context) => {
      restoreCachedTickets(queryClient, context?.previous ?? []);
      toast.error(error.message || "Failed to delete ticket.");
    },
    onSettled: (_data, _error, _ticketId, context) => {
      const userId = getUserId(queryClient);
      if (userId && context?.projectId) {
        invalidateProjectAnalytics(queryClient, userId, context.projectId);
      }
    },
  });
}

export function useCreateDevBoardProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectCreateInput) => {
      const userId = getUserId(queryClient);
      if (!userId) throw new Error("You must be signed in to create projects.");
      return projectsService.createProject(input, userId);
    },
    onSuccess: () => {
      const userId = getUserId(queryClient);
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: devBoardKeys.projects(userId) });
      }
      toast.success("Project created.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create project.");
    },
  });
}

export function useUpdateDevBoardProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      input,
    }: {
      projectId: string;
      input: ProjectUpdateInput;
    }) => {
      const userId = getUserId(queryClient);
      if (!userId) throw new Error("You must be signed in to update projects.");
      return projectsService.updateProject(projectId, input, userId);
    },
    onSuccess: (project: Project) => {
      const userId = getUserId(queryClient);
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: devBoardKeys.projects(userId) });
        void queryClient.invalidateQueries({
          queryKey: devBoardKeys.project(userId, project.id),
        });
      }
      toast.success("Project updated.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update project.");
    },
  });
}

export function useDeleteDevBoardProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const userId = getUserId(queryClient);
      if (!userId) throw new Error("You must be signed in to delete projects.");
      await projectsService.deleteProject(projectId, userId);
      return projectId;
    },
    onSuccess: (projectId) => {
      const userId = getUserId(queryClient);
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: devBoardKeys.projects(userId) });
        queryClient.removeQueries({ queryKey: devBoardKeys.project(userId, projectId) });
      }
      toast.success("Project deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete project.");
    },
  });
}
