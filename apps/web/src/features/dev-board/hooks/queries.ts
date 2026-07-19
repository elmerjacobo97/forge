import { useEffect } from "react";
import { Channel, Query, Realtime } from "appwrite";
import { type InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/appwrite";

import { devBoardService, toTicket, type TicketPage, type TicketRow } from "../services/dev-board-service";
import { devBoardAnalyticsService } from "../services/dev-board-analytics-service";
import { projectsService } from "../services/projects-service";
import type { AnalyticsRange } from "../types/analytics";
import { COLUMNS, type ColumnId } from "../types/board";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID;

export const devBoardKeys = {
  all: ["dev-board"] as const,
  user: (userId: string) => [...devBoardKeys.all, userId] as const,
  projects: (userId: string) => [...devBoardKeys.user(userId), "projects"] as const,
  project: (userId: string, projectId: string) =>
    [...devBoardKeys.user(userId), "project", projectId] as const,
  column: (userId: string, projectId: string, column: ColumnId) =>
    [...devBoardKeys.project(userId, projectId), column] as const,
  analytics: (userId: string, projectId: string, from: string, to: string) =>
    [...devBoardKeys.project(userId, projectId), "analytics", from, to] as const,
};

export const devBoardMutationKeys = {
  update: ["dev-board", "update"] as const,
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && (COLUMNS as readonly string[]).includes(value);
}

export function isColumnQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.length === 5 && queryKey[2] === "project" && isColumnId(queryKey[4]);
}

export function useDevBoardProjects(userId: string | undefined) {
  return useQuery({
    queryKey: devBoardKeys.projects(userId ?? "anonymous"),
    queryFn: () => projectsService.listProjects(userId!),
    enabled: Boolean(userId),
  });
}

export function useDevBoardProject(userId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: devBoardKeys.project(userId ?? "anonymous", projectId ?? "missing"),
    queryFn: () => projectsService.getProject(projectId!, userId!),
    enabled: Boolean(userId && projectId),
  });
}

export function useDevBoardTickets(
  userId: string | undefined,
  projectId: string | undefined,
  column: ColumnId,
) {
  return useInfiniteQuery({
    queryKey: devBoardKeys.column(userId ?? "anonymous", projectId ?? "missing", column),
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
      projectId ?? "missing",
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
    "projectId" in payload &&
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
    queryKey: devBoardKeys.project(userId, ticket.projectId),
  });
  const previousColumn = cachedTickets.find(
    ([key, data]) =>
      isColumnQueryKey(key) &&
      isTicketPage(data) &&
      data.pages.some((page) => page.tickets.some((item) => item.id === ticket.id)),
  )?.[0][4] as ColumnId | undefined;

  if (previousColumn === ticket.column) {
    queryClient.setQueryData<InfiniteData<TicketPage>>(
      devBoardKeys.column(userId, ticket.projectId, ticket.column),
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
      devBoardKeys.column(userId, ticket.projectId, previousColumn),
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
    devBoardKeys.column(userId, ticket.projectId, ticket.column),
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
            predicate: (query) => isColumnQueryKey(query.queryKey),
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
