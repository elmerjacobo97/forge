import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { userQueryOptions } from "@/features/auth/hooks/queries";
import type { AuthUser } from "@/features/auth/types";

import { devBoardService, type TicketPage } from "../services/dev-board-service";
import type { Ticket } from "../types/board";
import { devBoardKeys, devBoardMutationKeys } from "./queries";

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

  if (previousTicket.column === ticket.column) {
    queryClient.setQueryData<InfiniteData<TicketPage>>(
      devBoardKeys.column(userId, ticket.column),
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
    devBoardKeys.column(userId, previousTicket.column),
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
    devBoardKeys.column(userId, ticket.column),
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
      await queryClient.cancelQueries({ queryKey: devBoardKeys.user(userId) });
      const previous = queryClient.getQueriesData<InfiniteData<TicketPage>>({
        queryKey: devBoardKeys.user(userId),
      });
      updateCachedTicket(queryClient, userId, ticket);
      return previous;
    },
    onError: (error: Error, _ticket, previous) => {
      restoreCachedTickets(queryClient, previous ?? []);
      toast.error(error.message || "Failed to save ticket.");
    },
    onSettled: () => {
      const userId = getUserId(queryClient);
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: [...devBoardKeys.user(userId), "analytics"],
        });
      }
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
      await queryClient.cancelQueries({ queryKey: devBoardKeys.column(userId, "backlog") });
      const previous = queryClient.getQueriesData<InfiniteData<TicketPage>>({
        queryKey: devBoardKeys.user(userId),
      });
      queryClient.setQueryData<InfiniteData<TicketPage>>(
        devBoardKeys.column(userId, "backlog"),
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
    onSettled: () => {
      const userId = getUserId(queryClient);
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: [...devBoardKeys.user(userId), "analytics"],
        });
      }
    },
  });
}

export function useDeleteDevBoardTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => devBoardService.deleteTicket(ticketId),
    onMutate: async (ticketId) => {
      const userId = getUserId(queryClient);
      if (!userId) return [];
      await queryClient.cancelQueries({ queryKey: devBoardKeys.user(userId) });
      const previous = queryClient.getQueriesData<InfiniteData<TicketPage>>({
        queryKey: devBoardKeys.user(userId),
      });
      queryClient.setQueriesData<InfiniteData<TicketPage>>(
        { queryKey: devBoardKeys.user(userId) },
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
      return previous;
    },
    onError: (error: Error, _ticketId, previous) => {
      restoreCachedTickets(queryClient, previous ?? []);
      toast.error(error.message || "Failed to delete ticket.");
    },
    onSettled: () => {
      const userId = getUserId(queryClient);
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: [...devBoardKeys.user(userId), "analytics"],
        });
      }
    },
  });
}
