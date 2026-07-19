import { useEffect } from "react";
import { Channel, Query, Realtime } from "appwrite";
import { type InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/appwrite";

import { devBoardService, toTicket, type TicketPage, type TicketRow } from "../services/dev-board-service";
import { devBoardAnalyticsService } from "../services/dev-board-analytics-service";
import type { AnalyticsRange } from "../types/analytics";
import type { ColumnId } from "../types/board";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID;

export const devBoardKeys = {
  all: ["dev-board"] as const,
  user: (userId: string) => [...devBoardKeys.all, userId] as const,
  column: (userId: string, column: ColumnId) => [...devBoardKeys.user(userId), column] as const,
  analytics: (userId: string, from: string, to: string) =>
    [...devBoardKeys.user(userId), "analytics", from, to] as const,
};

export const devBoardMutationKeys = {
  update: ["dev-board", "update"] as const,
};

export function useDevBoardTickets(
  userId: string | undefined,
  projectId: string | undefined,
  column: ColumnId,
) {
  return useInfiniteQuery({
    queryKey: devBoardKeys.column(userId ?? "anonymous", column),
    queryFn: ({ pageParam }) =>
      devBoardService.fetchTicketPage(userId!, projectId!, column, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled: Boolean(userId && projectId),
  });
}

export function useDevBoardAnalytics(
  userId: string | undefined,
  projectId: string | undefined,
  range: AnalyticsRange | undefined,
) {
  return useQuery({
    queryKey: devBoardKeys.analytics(
      userId ?? "anonymous",
      range?.from ?? "incomplete",
      range?.to ?? "incomplete",
    ),
    queryFn: () => {
      if (!range) throw new Error("Select a complete date range.");
      return devBoardAnalyticsService.fetchAnalytics(userId!, projectId!, range);
    },
    enabled: Boolean(userId && projectId && range),
  });
}

function isTicketRow(payload: unknown): payload is TicketRow {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "$id" in payload &&
    "$createdAt" in payload &&
    "title" in payload &&
    "column" in payload
  );
}

function isTicketPage(data: unknown): data is InfiniteData<TicketPage> {
  return (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    Array.isArray(data.pages)
  );
}

function updateRealtimeTicket(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  ticket: ReturnType<typeof toTicket>,
): void {
  const cachedTickets = queryClient.getQueriesData<InfiniteData<TicketPage>>({
    queryKey: devBoardKeys.user(userId),
  });
  const previousColumn = cachedTickets.find(([, data]) =>
    isTicketPage(data) && data.pages.some((page) => page.tickets.some((item) => item.id === ticket.id)),
  )?.[0][2] as ColumnId | undefined;

  if (previousColumn === ticket.column) {
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

  if (previousColumn) {
    queryClient.setQueryData<InfiniteData<TicketPage>>(
      devBoardKeys.column(userId, previousColumn),
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
  }

  queryClient.setQueryData<InfiniteData<TicketPage>>(
    devBoardKeys.column(userId, ticket.column),
    (current) => {
      if (!current || current.pages.length === 0) return current;
      const [firstPage, ...rest] = current.pages;
      const existing = firstPage.tickets.some((item) => item.id === ticket.id);
      return {
        ...current,
        pages: [
          {
            ...firstPage,
            tickets: existing
              ? firstPage.tickets.map((item) => (item.id === ticket.id ? ticket : item))
              : [ticket, ...firstPage.tickets].sort((a, b) => b.position - a.position),
            total: existing ? firstPage.total : firstPage.total + 1,
          },
          ...rest,
        ],
      };
    },
  );
}

export function useDevBoardRealtime(userId: string | undefined): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId || !databaseId || !tableId) return;

    const realtime = new Realtime(client);
    let cancelled = false;
    let unsubscribe: (() => Promise<void>) | undefined;
    void realtime
      .subscribe(
        Channel.tablesdb(databaseId).table(tableId).row(),
        (event) => {
          if (queryClient.isMutating({ mutationKey: devBoardMutationKeys.update }) > 0) return;
          if (isTicketRow(event.payload)) {
            updateRealtimeTicket(queryClient, userId, toTicket(event.payload));
            return;
          }
          void queryClient.invalidateQueries({
            queryKey: devBoardKeys.user(userId),
            predicate: (query) => query.queryKey.length === 3,
          });
        },
        [Query.equal("userId", [userId])],
      )
      .then((subscription) => {
        unsubscribe = subscription.unsubscribe;
        if (cancelled) void unsubscribe();
      })
      .catch((error: unknown) => console.error("Dev Board Realtime subscription failed:", error));

    return () => {
      cancelled = true;
      if (unsubscribe) void unsubscribe();
    };
  }, [queryClient, userId]);
}
